/**
 * Xray config manipulation utilities
 * Uses temp files for safe jq operations (avoids shell escaping issues)
 */
const { runCommand } = require('./exec');
const fs = require('fs');
const path = require('path');

const XRAY_CONFIG = '/etc/xray/config.json';

/**
 * Safely read and parse xray config
 */
async function readXrayConfig() {
  const raw = await runCommand(`cat ${XRAY_CONFIG}`);
  return JSON.parse(raw);
}

/**
 * Safely write xray config (with backup)
 */
async function writeXrayConfig(config) {
  await runCommand(`cp ${XRAY_CONFIG} ${XRAY_CONFIG}.bak`);
  const tmpFile = '/tmp/xray_config_tmp.json';
  fs.writeFileSync(tmpFile, JSON.stringify(config, null, 2), 'utf8');
  await runCommand(`mv ${tmpFile} ${XRAY_CONFIG}`);
}

/**
 * Find inbound by protocol
 */
function findInbound(config, protocol) {
  return config.inbounds ? config.inbounds.find(ib => ib.protocol === protocol) : null;
}

/**
 * Add a client to xray config (direct JSON manipulation, no jq)
 */
async function addClient(protocol, clientObj) {
  try {
    const config = await readXrayConfig();
    const inbound = findInbound(config, protocol);
    if (!inbound) throw new Error(`Inbound ${protocol} non trouvé dans la config Xray`);
    if (!inbound.settings) inbound.settings = {};
    if (!inbound.settings.clients) inbound.settings.clients = [];
    inbound.settings.clients.push(clientObj);
    await writeXrayConfig(config);
    await runCommand('systemctl restart xray 2>/dev/null || true');
  } catch (err) {
    // Restore backup on failure
    await runCommand(`[ -f ${XRAY_CONFIG}.bak ] && mv ${XRAY_CONFIG}.bak ${XRAY_CONFIG} || true`).catch(() => {});
    throw err;
  }
}

/**
 * Remove a client from xray config by email/user field
 */
async function removeClient(protocol, email) {
  try {
    const config = await readXrayConfig();
    const inbound = findInbound(config, protocol);
    if (!inbound || !inbound.settings || !inbound.settings.clients) return;
    const field = protocol === 'socks' ? 'user' : 'email';
    inbound.settings.clients = inbound.settings.clients.filter(c => c[field] !== email);
    await writeXrayConfig(config);
    await runCommand('systemctl restart xray 2>/dev/null || true');
  } catch (err) {
    await runCommand(`[ -f ${XRAY_CONFIG}.bak ] && mv ${XRAY_CONFIG}.bak ${XRAY_CONFIG} || true`).catch(() => {});
    throw err;
  }
}

/**
 * Update a client field in xray config
 */
async function updateClientField(protocol, email, field, value) {
  try {
    const config = await readXrayConfig();
    const inbound = findInbound(config, protocol);
    if (!inbound || !inbound.settings || !inbound.settings.clients) throw new Error('Client non trouvé');
    const selector = protocol === 'socks' ? 'user' : 'email';
    const client = inbound.settings.clients.find(c => c[selector] === email);
    if (!client) throw new Error(`Client ${email} non trouvé`);
    client[field] = value;
    await writeXrayConfig(config);
    await runCommand('systemctl restart xray 2>/dev/null || true');
  } catch (err) {
    await runCommand(`[ -f ${XRAY_CONFIG}.bak ] && mv ${XRAY_CONFIG}.bak ${XRAY_CONFIG} || true`).catch(() => {});
    throw err;
  }
}

/**
 * Rename client (update email field)
 */
async function renameClient(protocol, oldEmail, newEmail) {
  const selector = protocol === 'socks' ? 'user' : 'email';
  await updateClientField(protocol, oldEmail, selector, newEmail);
}

/**
 * Count active connections for a specific xray user
 * Uses xray access log to count recent connections by email
 */
async function countUserConnections(email) {
  try {
    // Method 1: Count from xray access log (last 60 seconds of activity)
    const logCount = await runCommand(
      `grep '${email}' /var/log/xray/access.log 2>/dev/null | awk -F'[ :]' '{print $1":"$2}' | sort -u | tail -60 | wc -l`
    ).catch(() => '0');
    if (parseInt(logCount) > 0) return parseInt(logCount);

    // Method 2: Try xray API stats
    try {
      const result = await runCommand(
        `xray api statsquery --server=127.0.0.1:10085 -pattern "user>>>${email}>>>traffic>>>uplink" 2>/dev/null`
      );
      // If we get a response, user has traffic = at least potentially connected
      if (result && result.includes('value')) return 1;
    } catch {}

    // Method 3: Count established xray connections via ss
    const ssCount = await runCommand(`ss -tnp 2>/dev/null | grep xray | grep ESTAB | wc -l`).catch(() => '0');
    return parseInt(ssCount) || 0;
  } catch { return 0; }
}

/**
 * Get list of all clients for a protocol
 */
async function getClients(protocol) {
  try {
    const config = await readXrayConfig();
    const inbound = findInbound(config, protocol);
    if (!inbound || !inbound.settings || !inbound.settings.clients) return [];
    return inbound.settings.clients;
  } catch { return []; }
}

/**
 * Get xray config inbound ports for a protocol
 */
async function getInboundPort(protocol) {
  try {
    const config = await readXrayConfig();
    const inbound = findInbound(config, protocol);
    return inbound ? inbound.port : null;
  } catch { return null; }
}

module.exports = { 
  readXrayConfig, writeXrayConfig, findInbound,
  addClient, removeClient, updateClientField, renameClient, 
  countUserConnections, getClients, getInboundPort 
};
