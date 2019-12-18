/**
 * Returns an action object used to register a new keyboard shortcut.
 *
 * @param {string} name        Shortcut name.
 * @param {string} category    Shortcut category.
 * @param {string} description Shortcut description.
 * @param {Object} combination Shortcut key combination.
 * @param {Array}  aliases     Shortcut aliases.
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
 * @param {string} name Shortcut name.
 */
export function unregisterShortcut( name ) {
	return {
		type: 'REGISTER_SHORTCUT',
		name,
	};
}
