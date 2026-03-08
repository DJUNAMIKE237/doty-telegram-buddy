const { runCommand, isServiceRunning } = require('../utils/exec');

function showMenu(bot, chatId) {
  bot.sendMessage(chatId,
    `━━━━━━━━━━━━━━━━━━━━━\n📊 *STATUS MENU*\n━━━━━━━━━━━━━━━━━━━━━`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Tous les services', callback_data: 'status_all' }],
          [{ text: '🔄 Restart Xray', callback_data: 'status_restart_xray' }],
          [{ text: '🔄 Restart Nginx', callback_data: 'status_restart_nginx' }],
          [{ text: '🔄 Restart Tous', callback_data: 'status_restart_all' }],
          [{ text: '💻 Ressources', callback_data: 'status_resources' }],
          [{ text: '🔙 Menu Principal', callback_data: 'back_main' }],
        ],
      },
    }
  );
}

async function handleCallback(bot, chatId, data) {
  switch (data) {
    case 'status_all':
      try {
        const services = ['xray', 'nginx', 'sshd', 'dropbear', 'stunnel5', 'squid', 'openvpn@server-tcp', 'openvpn@server-udp', 'sldns-server', 'udp-custom', 'ws-stunnel'];
        let text = '📊 *Services Status*\n━━━━━━━━━━━━━━━\n';
        for (const s of services) {
          const active = await isServiceRunning(s);
          text += `${active ? '✅' : '❌'} ${s}\n`;
        }
        bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'status_restart_xray':
      try { await runCommand('systemctl restart xray'); bot.sendMessage(chatId, '✅ Xray redémarré.'); }
      catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'status_restart_nginx':
      try { await runCommand('systemctl restart nginx'); bot.sendMessage(chatId, '✅ Nginx redémarré.'); }
      catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'status_restart_all':
      try {
        bot.sendMessage(chatId, '⏳ Redémarrage de tous les services...');
        await runCommand('systemctl restart xray nginx sshd stunnel5 squid ws-stunnel 2>/dev/null || true');
        bot.sendMessage(chatId, '✅ Tous les services redémarrés.');
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
    case 'status_resources':
      try {
        const ram = await runCommand('free -m | awk \'NR==2{printf "Used: %sMB / Total: %sMB (%.1f%%)", $3, $2, $3*100/$2}\'');
        const disk = await runCommand('df -h / | awk \'NR==2{printf "Used: %s / Total: %s (%s)", $3, $2, $5}\'');
        const cpu = await runCommand('top -bn1 | grep "Cpu(s)" | awk \'{printf "%.1f%%", $2}\'');
        const load = await runCommand('cat /proc/loadavg | awk \'{print $1, $2, $3}\'');
        bot.sendMessage(chatId, `💻 *Ressources Serveur*\n━━━━━━━━━━━━━━━\n🧠 RAM: ${ram}\n💾 Disk: ${disk}\n⚙️ CPU: ${cpu}\n📈 Load: ${load}`, { parse_mode: 'Markdown' });
      } catch (err) { bot.sendMessage(chatId, `❌ ${err.message}`); }
      break;
  }
}

module.exports = { showMenu, handleCallback };
