/**
 * Returns an action object used in signalling that format types have been
 * added.
 * Ignored from documentation as registerFormatType should be used instead from @wordpress/rich-text
 *
 * @ignore
 *
 * @param {Array|Object} formatTypes Format types received.
 *
 * @return {Object} Action object.
 */
export function addFormatTypes( formatTypes ) {
	return {
		type: 'ADD_FORMAT_TYPES',
		formatTypes: Array.isArray( formatTypes )
			? formatTypes
			: [ formatTypes ],
	};
}

/**
 * Returns an action object used to remove a registered format type.
 *
 * Ignored from documentation as unregisterFormatType should be used instead from @wordpress/rich-text
 *
 * @ignore
 *
 * @param {string|Array} names Format name.
 *
 * @return {Object} Action object.
 */
export function removeFormatTypes( names ) {
	return {
		type: 'REMOVE_FORMAT_TYPES',
		names: Array.isArray( names ) ? names : [ names ],
	};
}
