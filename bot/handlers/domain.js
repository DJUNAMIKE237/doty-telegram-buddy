const { runCommand } = require('../utils/exec');

function showMenu(bot, chatId) {
  bot.sendMessage(chatId,
    `━━━━━━━━━━━━━━━━━━━━━\n🌍 *DOMAIN MENU*\n━━━━━━━━━━━━━━━━━━━━━`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 Domain Actuel', callback_data: 'domain_show' }],
          [{ text: '✏️ Changer Domain', callback_data: 'domain_change' }],
          [{ text: '🔄 Renouveler SSL', callback_data: 'domain_ssl' }],
          [{ text: '📋 Info SSL', callback_data: 'domain_ssl_info' }],
          [{ text: '🔙 Menu Principal', callback_data: 'back_main' }],
        ],
      },
    }
  );
}

async function handleCallback(bot, chatId, data, query) {
  const { pendingActions } = require('../index');
  switch (data) {
    case 'domain_show':
      try {
        const domain = await runCommand('cat /etc/xray/domain 2>/dev/null || echo "Non configuré"');
        bot.sendMessage(chatId, `🌍 Domain actuel: \`${domain}\``, { parse_mode: 'Markdown' });
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'domain_change':
      bot.sendMessage(chatId, '✏️ Entrez le nouveau domaine:');
      pendingActions[chatId] = { action: 'domain_change', handler: handleDomainChange };
      break;
    case 'domain_ssl':
      try {
        bot.sendMessage(chatId, '⏳ Renouvellement SSL en cours...');
        const domain = await runCommand('cat /etc/xray/domain');
        await runCommand(`certbot renew --force-renewal 2>/dev/null || ~/.acme.sh/acme.sh --renew -d ${domain} --force 2>/dev/null || true`, 120000);
        await runCommand('systemctl restart nginx xray');
        bot.sendMessage(chatId, '✅ SSL renouvelé avec succès!');
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'domain_ssl_info':
      try {
        const domain = await runCommand('cat /etc/xray/domain');
        const info = await runCommand(`echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "Impossible de lire le certificat"`);
        bot.sendMessage(chatId, `📋 *SSL Info*\n\`\`\`\n${info}\n\`\`\``, { parse_mode: 'Markdown' });
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
  }
}

async function handleDomainChange(bot, chatId, text, pending, pendingActions) {
  delete pendingActions[chatId];
  const domain = text.trim();
  try {
    bot.sendMessage(chatId, `⏳ Configuration du domaine *${domain}*...`, { parse_mode: 'Markdown' });
    await runCommand(`echo "${domain}" > /etc/xray/domain`);
    
    // Request SSL cert
    await runCommand(`systemctl stop nginx 2>/dev/null || true`);
    await runCommand(`certbot certonly --standalone --agree-tos --register-unsafely-without-email -d ${domain} 2>/dev/null || ~/.acme.sh/acme.sh --issue -d ${domain} --standalone 2>/dev/null || true`, 120000);
    
    // Update nginx config
    await runCommand(`sed -i "s/server_name .*/server_name ${domain};/" /etc/nginx/conf.d/*.conf 2>/dev/null || true`);
    await runCommand('systemctl restart nginx xray');
    
    bot.sendMessage(chatId, `✅ Domaine changé en: \`${domain}\``, { parse_mode: 'Markdown' });
  } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
}

module.exports = { showMenu, handleCallback };
