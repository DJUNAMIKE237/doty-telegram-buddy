const { runCommand } = require('../utils/exec');

function showMenu(bot, chatId) {
  bot.sendMessage(chatId,
    `━━━━━━━━━━━━━━━━━━━━━\n📋 *LOG MENU*\n━━━━━━━━━━━━━━━━━━━━━`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Xray Logs', callback_data: 'log_xray' }],
          [{ text: '📋 Nginx Access', callback_data: 'log_nginx_access' }],
          [{ text: '📋 Nginx Error', callback_data: 'log_nginx_error' }],
          [{ text: '📋 SSH Auth', callback_data: 'log_auth' }],
          [{ text: '🗑 Clear Logs', callback_data: 'log_clear' }],
          [{ text: '🔙 Menu Principal', callback_data: 'back_main' }],
        ],
      },
    }
  );
}

async function handleCallback(bot, chatId, data) {
  switch (data) {
    case 'log_xray':
      await sendLog(bot, chatId, 'journalctl -u xray --no-pager -n 30');
      break;
    case 'log_nginx_access':
      await sendLog(bot, chatId, 'tail -30 /var/log/nginx/access.log 2>/dev/null || echo "Pas de log"');
      break;
    case 'log_nginx_error':
      await sendLog(bot, chatId, 'tail -30 /var/log/nginx/error.log 2>/dev/null || echo "Pas de log"');
      break;
    case 'log_auth':
      await sendLog(bot, chatId, 'tail -30 /var/log/auth.log 2>/dev/null || echo "Pas de log"');
      break;
    case 'log_clear':
      try {
        await runCommand('truncate -s 0 /var/log/nginx/*.log /var/log/auth.log 2>/dev/null; journalctl --vacuum-time=1s 2>/dev/null || true');
        bot.sendMessage(chatId, '✅ Logs nettoyés.');
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
  }
}

async function sendLog(bot, chatId, command) {
  try {
    const logs = await runCommand(command);
    if (logs.length > 4000) {
      bot.sendDocument(chatId, Buffer.from(logs), { filename: 'log.txt' }, { contentType: 'text/plain' });
    } else {
      bot.sendMessage(chatId, `📋 *Logs:*\n\`\`\`\n${logs || 'Vide'}\n\`\`\``, { parse_mode: 'Markdown' });
    }
  } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
}

module.exports = { showMenu, handleCallback };
