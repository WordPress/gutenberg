/**
 * Returns an action object used to register a new keyboard shortcut.
 *
 * @param {string} name
 * @param {string} category
 * @param {Object} combination
 * @param {Array}  aliases
 */
export function registerShortcut( name, category, combination, aliases ) {
	return {
		type: 'REGISTER_SHORTCUT',
		name,
		category,
		combination,
		aliases,
	};
}

/**
 * Returns an action object used to register a new keyboard shortcut.
 *
 * @param {string} name
 */
export function unregisterShortcut( name ) {
	return {
		type: 'REGISTER_SHORTCUT',
		name,
	};
}
