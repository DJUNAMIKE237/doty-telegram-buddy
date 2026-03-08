const { runCommand } = require('../utils/exec');

function showMenu(bot, chatId) {
  bot.sendMessage(chatId,
    `━━━━━━━━━━━━━━━━━━━━━\n🔧 *PORT MENU*\n━━━━━━━━━━━━━━━━━━━━━`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Ports par défaut', callback_data: 'port_default' }],
          [{ text: '🔍 Ports ouverts', callback_data: 'port_open' }],
          [{ text: '✏️ Changer Port SSH', callback_data: 'port_ssh' }],
          [{ text: '✏️ Changer Port Squid', callback_data: 'port_squid' }],
          [{ text: '🔙 Menu Principal', callback_data: 'back_main' }],
        ],
      },
    }
  );
}

async function handleCallback(bot, chatId, data, query) {
  const { pendingActions } = require('../index');
  switch (data) {
    case 'port_default':
      bot.sendMessage(chatId,
        `🔧 *Ports par défaut*\n━━━━━━━━━━━━━━━\nVLESS/VMESS/Trojan/SOCKS:\n  TLS: 443 | NTLS: 80\ngRPC: 443\nSSH WS: 443/80\nSquid: 3128, 8080\nOpenVPN: TCP 1194 | UDP 2200\nOHP: 8000\nZIVPN: 5667\nVMESS Custom: TLS 2083 | NTLS 2082\nVLESS Custom: TLS 2087 | NTLS 2086`,
        { parse_mode: 'Markdown' }
      );
      break;
    case 'port_open':
      try {
        const ports = await runCommand('ss -tlnp | grep LISTEN | awk \'{print $4}\' | sort -u | head -30');
        bot.sendMessage(chatId, `🔍 *Ports ouverts:*\n\`\`\`\n${ports}\n\`\`\``, { parse_mode: 'Markdown' });
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'port_ssh':
      bot.sendMessage(chatId, '✏️ Nouveau port SSH:');
      pendingActions[chatId] = { action: 'port_ssh', handler: async (bot, cid, text, p, pa) => {
        delete pa[cid];
        try {
          const port = parseInt(text);
          if (isNaN(port)) { bot.sendMessage(cid, '❌ Port invalide.'); return; }
          await runCommand(`sed -i "s/^Port .*/Port ${port}/" /etc/ssh/sshd_config`);
          await runCommand('systemctl restart sshd');
          bot.sendMessage(cid, `✅ Port SSH changé → ${port}`);
        } catch (err) { bot.sendMessage(cid, `❌ ${err.message}`); }
      }};
      break;
    case 'port_squid':
      bot.sendMessage(chatId, '✏️ Nouveau port Squid (ex: 3128):');
      pendingActions[chatId] = { action: 'port_squid', handler: async (bot, cid, text, p, pa) => {
        delete pa[cid];
        try {
          const port = parseInt(text);
          if (isNaN(port)) { bot.sendMessage(cid, '❌ Port invalide.'); return; }
          await runCommand(`sed -i "s/^http_port .*/http_port ${port}/" /etc/squid/squid.conf`);
          await runCommand('systemctl restart squid');
          bot.sendMessage(cid, `✅ Port Squid changé → ${port}`);
        } catch (err) { bot.sendMessage(cid, `❌ ${err.message}`); }
      }};
      break;
  }
}

module.exports = { showMenu, handleCallback };
