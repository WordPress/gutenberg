/**
 * Returns an action object used to register a new keyboard shortcut.
 *
 * @param {string} name
 * @param {string} category
 * @param {Object} combination
 * @param {string} description
 * @param {Array}  aliases
 */
export function registerShortcut( name, category, description, combination, aliases ) {
	return {
		type: 'REGISTER_SHORTCUT',
		name,
		category,
		combination,
		aliases,
		description,
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
