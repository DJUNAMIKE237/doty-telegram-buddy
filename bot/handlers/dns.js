const { runCommand } = require('../utils/exec');

function showMenu(bot, chatId) {
  bot.sendMessage(chatId,
    `━━━━━━━━━━━━━━━━━━━━━\n📡 *DNS / SLOWDNS MENU*\n━━━━━━━━━━━━━━━━━━━━━`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Status SlowDNS', callback_data: 'dns_status' }],
          [{ text: '🔄 Restart SlowDNS', callback_data: 'dns_restart' }],
          [{ text: '🔑 NS Key', callback_data: 'dns_key' }],
          [{ text: '⚙️ Config DNS', callback_data: 'dns_config' }],
          [{ text: '🔙 Menu Principal', callback_data: 'back_main' }],
        ],
      },
    }
  );
}

async function handleCallback(bot, chatId, data) {
  switch (data) {
    case 'dns_status':
      try {
        const sldns = await runCommand('systemctl is-active sldns-server 2>/dev/null || echo inactive');
        bot.sendMessage(chatId, `📡 SlowDNS: ${sldns === 'active' ? '✅ Active' : '❌ Inactive'}`, { parse_mode: 'Markdown' });
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'dns_restart':
      try {
        await runCommand('systemctl restart sldns-server');
        bot.sendMessage(chatId, '✅ SlowDNS redémarré.');
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'dns_key':
      try {
        const key = await runCommand('cat /etc/slowdns/server.pub 2>/dev/null || echo "Clé non trouvée"');
        bot.sendMessage(chatId, `🔑 *NS Public Key:*\n\`${key}\``, { parse_mode: 'Markdown' });
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'dns_config':
      try {
        const ns = await runCommand('cat /etc/slowdns/ns 2>/dev/null || echo "N/A"');
        const domain = await runCommand('cat /etc/xray/domain 2>/dev/null || echo "N/A"');
        bot.sendMessage(chatId, `⚙️ *DNS Config*\n\nNS: \`${ns}\`\nDomain: \`${domain}\``, { parse_mode: 'Markdown' });
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
  }
}

module.exports = { showMenu, handleCallback };
