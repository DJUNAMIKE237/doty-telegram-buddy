const { runCommand } = require('../utils/exec');

function showMenu(bot, chatId) {
  bot.sendMessage(chatId,
    `━━━━━━━━━━━━━━━━━━━━━\n📱 *ZIVPN MENU*\n━━━━━━━━━━━━━━━━━━━━━`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Status', callback_data: 'zivpn_status' }],
          [{ text: '🔄 Restart', callback_data: 'zivpn_restart' }],
          [{ text: '⚙️ Config', callback_data: 'zivpn_config' }],
          [{ text: '🔙 Menu Principal', callback_data: 'back_main' }],
        ],
      },
    }
  );
}

async function handleCallback(bot, chatId, data) {
  switch (data) {
    case 'zivpn_status':
      try {
        const status = await runCommand('systemctl is-active zivpn 2>/dev/null || echo inactive');
        bot.sendMessage(chatId, `📱 ZIVPN: ${status === 'active' ? '✅ Active' : '❌ Inactive'}\nPort: 5667 UDP`);
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'zivpn_restart':
      try {
        await runCommand('systemctl restart zivpn');
        bot.sendMessage(chatId, '✅ ZIVPN redémarré.');
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'zivpn_config':
      try {
        const config = await runCommand('cat /etc/zivpn/config.json 2>/dev/null || echo "Config non trouvée"');
        bot.sendMessage(chatId, `⚙️ *ZIVPN Config:*\n\`\`\`json\n${config}\n\`\`\``, { parse_mode: 'Markdown' });
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
  }
}

module.exports = { showMenu, handleCallback };
