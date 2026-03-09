/**
 * Shared utilities for all protocol handlers
 */
const { autoDeleteSend, scheduleDelete } = require('./autodelete');
const audit = require('./audit');

/**
 * Edit existing message or send new one
 */
function editOrSend(bot, chatId, msgId, text, opts = {}) {
  if (msgId) {
    return bot.editMessageText(text, { chat_id: chatId, message_id: msgId, ...opts })
      .catch(() => bot.sendMessage(chatId, text, opts));
  }
  return bot.sendMessage(chatId, text, opts);
}

/**
 * Send message with auto-delete + also delete user's message
 */
function autoSend(bot, chatId, text, opts = {}, userMsgId = null) {
  return autoDeleteSend(bot, chatId, text, opts, userMsgId);
}

/**
 * Build error message with retry/cancel/home buttons
 * @param {string} errorText - Error message text
 * @param {string} retryCallback - Callback data for retry button
 * @param {string} menuCallback - Callback data for menu return
 */
function errorWithRetry(errorText, retryCallback, menuCallback = 'back_main') {
  return {
    text: `❌ ${errorText}`,
    opts: {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Réessayer', callback_data: retryCallback },
            { text: '❌ Annuler', callback_data: menuCallback },
          ],
          [{ text: '🏠 ACCUEIL', callback_data: 'back_main' }],
        ],
      },
    },
  };
}

/**
 * Standard back buttons
 */
function backButtons(menuCallback, includeHome = true) {
  const kb = [[{ text: '🔙 Retour', callback_data: menuCallback }]];
  if (includeHome) kb.push([{ text: '🏠 ACCUEIL', callback_data: 'back_main' }]);
  return { inline_keyboard: kb };
}

/**
 * Generate progress bar for data usage
 * @param {number} used - bytes used
 * @param {number} total - total limit bytes
 * @returns {string} formatted progress bar text
 */
function trafficProgressBar(used, total) {
  if (!total || total <= 0) return '';
  const pct = Math.min((used / total) * 100, 100);
  const filled = Math.round(pct / 10);
  const empty = 10 - filled;
  const isAlert = pct >= 80;
  const filledChar = isAlert ? '🟥' : '🟩';
  const emptyChar = '⬜';
  const bar = filledChar.repeat(filled) + emptyChar.repeat(empty);
  
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${bar}\n📊 ${pct.toFixed(1)}% utilisé\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

/**
 * Format traffic details with KB/MB/GB/TB breakdown
 */
function formatTrafficDetail(bytes) {
  if (bytes === 0) return '0 B';
  const units = [
    { name: 'TB', value: 1024 ** 4 },
    { name: 'GB', value: 1024 ** 3 },
    { name: 'MB', value: 1024 ** 2 },
    { name: 'KB', value: 1024 },
    { name: 'B', value: 1 },
  ];
  
  let remaining = bytes;
  const parts = [];
  for (const unit of units) {
    if (remaining >= unit.value) {
      const count = Math.floor(remaining / unit.value);
      remaining %= unit.value;
      parts.push(`${count} ${unit.name}`);
    }
  }
  return parts.join(' + ') || '0 B';
}

/**
 * Log audit action
 */
function logAudit(userId, category, action) {
  try {
    audit.log(userId, category, action);
  } catch {}
}

module.exports = {
  editOrSend,
  autoSend,
  errorWithRetry,
  backButtons,
  trafficProgressBar,
  formatTrafficDetail,
  logAudit,
};
