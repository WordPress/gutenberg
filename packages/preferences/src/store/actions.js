/**
 * Returns an action object used in signalling that a preference should be
 * toggled.
 *
 * @param {string} scope The preference scope (e.g. core/edit-post).
 * @param {string} name  The preference name.
 */
export function toggle( scope, name ) {
	return function ( { select, dispatch } ) {
		const currentValue = select.get( scope, name );
		dispatch.set( scope, name, ! currentValue );
	};
}

/**
 * Returns an action object used in signalling that a preference should be set
 * to a value
 *
 * @param {string} scope The preference scope (e.g. core/edit-post).
 * @param {string} name  The preference name.
 * @param {*}      value The value to set.
 *
 * @return {Object} Action object.
 */
export function set( scope, name, value ) {
	return {
		type: 'SET_PREFERENCE_VALUE',
		scope,
		name,
		value,
	};
}

/**
 * Returns an action object used in signalling that preference defaults should
 * be set.
 *
 * @param {string}            scope    The preference scope (e.g. core/edit-post).
 * @param {Object<string, *>} defaults A key/value map of preference names to values.
 *
 * @return {Object} Action object.
 */
export function setDefaults( scope, defaults ) {
	return {
		type: 'SET_PREFERENCE_DEFAULTS',
		scope,
		defaults,
	};
}
