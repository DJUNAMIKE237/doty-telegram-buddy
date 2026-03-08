const PAGE_SIZE = 5;

/**
 * Build a paginated inline keyboard from a list of users
 * @param {string[]} users - List of usernames
 * @param {string} prefix - Callback prefix for each user button
 * @param {string} pagePrefix - Callback prefix for page navigation
 * @param {number} page - Current page (0-indexed)
 * @param {string} backCallback - Callback for back button
 * @returns {object} reply_markup object
 */
function paginatedKeyboard(users, prefix, pagePrefix, page, backCallback) {
  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, users.length);
  const pageUsers = users.slice(start, end);

  const kb = pageUsers.map(u => [{ text: u, callback_data: `${prefix}${u}` }]);

  // Navigation row
  const navRow = [];
  if (currentPage > 0) {
    navRow.push({ text: '⬅️ Précédent', callback_data: `${pagePrefix}${currentPage - 1}` });
  }
  navRow.push({ text: `📄 ${currentPage + 1}/${totalPages}`, callback_data: 'noop' });
  if (currentPage < totalPages - 1) {
    navRow.push({ text: '➡️ Suivant', callback_data: `${pagePrefix}${currentPage + 1}` });
  }
  if (totalPages > 1) kb.push(navRow);

  kb.push([{ text: '🏠 ACCUEIL', callback_data: 'back_main' }]);
  kb.push([{ text: '🔙 Retour', callback_data: backCallback }]);

  return { reply_markup: { inline_keyboard: kb } };
}

/**
 * Parse page number from callback data
 */
function getPageFromCallback(data, prefix) {
  return parseInt(data.replace(prefix, '')) || 0;
}

module.exports = { paginatedKeyboard, getPageFromCallback, PAGE_SIZE };
