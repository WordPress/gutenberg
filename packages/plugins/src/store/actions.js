/**
 * Returns an action object used to toggle a plugin item flag.
 *
 * @param {string} itemName Item name.
 *
 * @return {Object} Action object.
 */
export function togglePinnedPluginItem( itemName ) {
	return {
		type: 'TOGGLE_PINNED_PLUGIN_ITEM',
		itemName,
	};
}
