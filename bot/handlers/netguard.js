const { runCommand } = require('../utils/exec');

function showMenu(bot, chatId) {
  bot.sendMessage(chatId,
    `━━━━━━━━━━━━━━━━━━━━━\n🛡️ *NETGUARD / HOST BLOCKER*\n━━━━━━━━━━━━━━━━━━━━━`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Status', callback_data: 'netguard_status' }],
          [{ text: '🔒 Activer Blocker', callback_data: 'netguard_enable' }],
          [{ text: '🔓 Désactiver Blocker', callback_data: 'netguard_disable' }],
          [{ text: '🔄 Mettre à jour hosts', callback_data: 'netguard_update' }],
          [{ text: '🔙 Menu Principal', callback_data: 'back_main' }],
        ],
      },
    }
  );
}

async function handleCallback(bot, chatId, data) {
  switch (data) {
    case 'netguard_status':
      try {
        const hosts = await runCommand('wc -l /etc/hosts | awk \'{print $1}\'');
        bot.sendMessage(chatId, `🛡️ *Host Blocker*\n\nEntrées bloquées: ${hosts} lignes dans /etc/hosts`, { parse_mode: 'Markdown' });
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'netguard_enable':
      try {
        await runCommand('wget -qO /etc/hosts https://raw.githubusercontent.com/dotywrt/doty/main/module/hosts 2>/dev/null || true');
        bot.sendMessage(chatId, '✅ Host Blocker activé (ads, torrents, adult sites).');
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'netguard_disable':
      try {
        await runCommand('echo -e "127.0.0.1 localhost\\n::1 localhost" > /etc/hosts');
        bot.sendMessage(chatId, '✅ Host Blocker désactivé.');
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'netguard_update':
      try {
        await runCommand('wget -qO /etc/hosts https://raw.githubusercontent.com/dotywrt/doty/main/module/hosts');
        bot.sendMessage(chatId, '✅ Liste de blocage mise à jour.');
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
  }
}

module.exports = { showMenu, handleCallback };
