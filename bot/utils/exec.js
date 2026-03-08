const { exec } = require('child_process');

/**
 * Execute a shell command and return the output
 */
function runCommand(command, timeout = 30000) {
  return new Promise((resolve, reject) => {
    exec(command, { timeout, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * Execute command with sudo
 */
function runSudo(command, timeout = 30000) {
  return runCommand(`sudo ${command}`, timeout);
}

/**
 * Check if a service is running
 */
async function isServiceRunning(serviceName) {
  try {
    const result = await runCommand(`systemctl is-active ${serviceName}`);
    return result === 'active';
  } catch {
    return false;
  }
}

/**
 * Restart a service
 */
async function restartService(serviceName) {
  return runSudo(`systemctl restart ${serviceName}`);
}

/**
 * Get server IP
 */
async function getServerIP() {
  try {
    return await runCommand('curl -s ifconfig.me');
  } catch {
    return 'Unknown';
  }
}

/**
 * Get domain from server
 */
async function getDomain() {
  try {
    return await runCommand('cat /etc/xray/domain 2>/dev/null || hostname');
  } catch {
    return 'Unknown';
  }
}

module.exports = { runCommand, runSudo, isServiceRunning, restartService, getServerIP, getDomain };
