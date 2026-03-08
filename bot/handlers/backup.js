const { runCommand } = require('../utils/exec');

function showMenu(bot, chatId) {
  bot.sendMessage(chatId,
    `━━━━━━━━━━━━━━━━━━━━━\n💾 *BACKUP MENU*\n━━━━━━━━━━━━━━━━━━━━━`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💾 Créer Backup', callback_data: 'backup_create' }],
          [{ text: '📥 Restaurer', callback_data: 'backup_restore' }],
          [{ text: '🔙 Menu Principal', callback_data: 'back_main' }],
        ],
      },
    }
  );
}

async function handleCallback(bot, chatId, data) {
  switch (data) {
    case 'backup_create':
      try {
        bot.sendMessage(chatId, '⏳ Création du backup...');
        const date = new Date().toISOString().split('T')[0];
        const backupFile = `/root/backup-${date}.tar.gz`;
        await runCommand(`tar -czf ${backupFile} /etc/xray /etc/ssh-users /etc/nginx/conf.d /etc/slowdns /etc/openvpn/client 2>/dev/null || true`);
        
        // Send file via Telegram
        const fs = require('fs');
        if (fs.existsSync(backupFile)) {
          bot.sendDocument(chatId, backupFile, { caption: `✅ Backup créé: ${date}` });
        } else {
          bot.sendMessage(chatId, '❌ Impossible de créer le backup.');
        }
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'backup_restore':
      bot.sendMessage(chatId, '📥 Envoyez le fichier backup (.tar.gz) en réponse à ce message.');
      // Handle document in main bot
      const handler = (msg) => {
        if (msg.chat.id !== chatId || !msg.document) return;
        bot.removeListener('message', handler);
        restoreBackup(bot, chatId, msg);
      };
      bot.on('message', handler);
      break;
  }
}

async function restoreBackup(bot, chatId, msg) {
  try {
    const fileId = msg.document.file_id;
    const filePath = await bot.getFileLink(fileId);
    bot.sendMessage(chatId, '⏳ Restauration en cours...');
    await runCommand(`wget -O /tmp/restore.tar.gz "${filePath}"`);
    await runCommand('cd / && tar -xzf /tmp/restore.tar.gz');
    await runCommand('systemctl restart xray nginx');
    bot.sendMessage(chatId, '✅ Backup restauré avec succès!');
  } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
}

module.exports = { showMenu, handleCallback };
