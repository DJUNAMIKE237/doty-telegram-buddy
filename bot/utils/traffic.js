const { runCommand } = require('./exec');
const fs = require('fs');

const TRAFFIC_DIR = '/etc/xray/traffic';
const LIMITS_DIR = '/etc/xray/limits';

async function ensureDirs() { try { await runCommand(`mkdir -p ${TRAFFIC_DIR} ${LIMITS_DIR}`); } catch {} }

/**
 * Get xray traffic stats via API (grpc stats service)
 */
async function getXrayTraffic(email) {
  try {
    let uplink = 0, downlink = 0;

    // Try xray API stats query
    try {
      const upResult = await runCommand(
        `xray api statsquery --server=127.0.0.1:10085 -pattern "user>>>${email}>>>traffic>>>uplink" 2>/dev/null`
      );
      // Parse the stat value from JSON response
      const upMatch = upResult.match(/"value"\s*:\s*"?(\d+)"?/);
      if (upMatch) uplink = parseInt(upMatch[1]) || 0;
    } catch {}

    try {
      const downResult = await runCommand(
        `xray api statsquery --server=127.0.0.1:10085 -pattern "user>>>${email}>>>traffic>>>downlink" 2>/dev/null`
      );
      const downMatch = downResult.match(/"value"\s*:\s*"?(\d+)"?/);
      if (downMatch) downlink = parseInt(downMatch[1]) || 0;
    } catch {}

    // Fallback: check stored traffic file
    if (uplink === 0 && downlink === 0) {
      try {
        const stored = JSON.parse(fs.readFileSync(`${TRAFFIC_DIR}/${email}.json`, 'utf8'));
        uplink = stored.uplink || 0;
        downlink = stored.downlink || 0;
      } catch {}
    }

    return { uplink, downlink, total: uplink + downlink };
  } catch { return { uplink: 0, downlink: 0, total: 0 }; }
}

/**
 * Get SSH traffic via iptables
 */
async function getSSHTraffic(username) {
  try {
    // Try iptables accounting
    const result = await runCommand(
      `iptables -nvx -L OUTPUT 2>/dev/null | grep "owner UID match $(id -u ${username} 2>/dev/null)" | awk '{print $2}'`
    ).catch(() => '0');
    const bytes = parseInt(result) || 0;
    return { uplink: 0, downlink: bytes, total: bytes };
  } catch { return { uplink: 0, downlink: 0, total: 0 }; }
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function parseLimitToBytes(limitStr) {
  const match = limitStr.toUpperCase().match(/^(\d+(?:\.\d+)?)\s*(GB|MB|TB|KB)$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2];
  const multipliers = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  return Math.floor(value * multipliers[unit]);
}

async function setDataLimit(protocol, username, limitBytes) {
  await ensureDirs();
  const filePath = `${LIMITS_DIR}/${protocol}_${username}.json`;
  const data = { protocol, username, limitBytes, suspended: false, createdAt: new Date().toISOString() };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

async function getDataLimit(protocol, username) {
  try {
    const data = fs.readFileSync(`${LIMITS_DIR}/${protocol}_${username}.json`, 'utf8');
    return JSON.parse(data);
  } catch { return null; }
}

async function removeDataLimit(protocol, username) {
  try { fs.unlinkSync(`${LIMITS_DIR}/${protocol}_${username}.json`); } catch {}
}

async function setConnLimit(protocol, username, maxConn) {
  await ensureDirs();
  const filePath = `${LIMITS_DIR}/${protocol}_${username}_conn.json`;
  const data = { protocol, username, maxConn };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function getConnLimit(protocol, username) {
  try {
    const data = fs.readFileSync(`${LIMITS_DIR}/${protocol}_${username}_conn.json`, 'utf8');
    return JSON.parse(data);
  } catch { return null; }
}

/**
 * Count SSH connections (inspired by TMY-SSH-PRO: ps aux | grep "sshd: username")
 */
async function countSSHConnections(username) {
  try {
    const result = await runCommand(`ps aux 2>/dev/null | grep "sshd: ${username}" | grep -v grep | wc -l`);
    return parseInt(result) || 0;
  } catch { return 0; }
}

/**
 * Count xray connections via access log
 */
async function countXrayConnections(email) {
  try {
    // Count unique source IPs in last 100 access log lines for this user
    const result = await runCommand(
      `grep '${email}' /var/log/xray/access.log 2>/dev/null | tail -100 | awk '{print $3}' | sort -u | wc -l`
    ).catch(() => '0');
    return parseInt(result) || 0;
  } catch { return 0; }
}

module.exports = {
  getXrayTraffic, getSSHTraffic, formatBytes, parseLimitToBytes,
  setDataLimit, getDataLimit, removeDataLimit,
  setConnLimit, getConnLimit, countXrayConnections, countSSHConnections,
  ensureDirs
};
