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

/**
 * Returns an action object used to disable a format type for a specific block type.
 *
 * Ignored from documentation as unregisterFormatTypeInBlock should be used instead from @wordpress/rich-text
 *
 * @ignore
 *
 * @param {string} blockName  Block name (e.g. 'core/heading').
 * @param {string} formatName Format type name (e.g. 'core/bold').
 *
 * @return {Object} Action object.
 */
export function disableFormatTypeInBlock( blockName, formatName ) {
	return {
		type: 'DISABLE_FORMAT_TYPE_IN_BLOCK',
		blockName,
		formatName,
	};
}

/**
 * Returns an action object used to re-enable a format type for a specific block type.
 *
 * Ignored from documentation as registerFormatTypeInBlock should be used instead from @wordpress/rich-text
 *
 * @ignore
 *
 * @param {string} blockName  Block name (e.g. 'core/heading').
 * @param {string} formatName Format type name (e.g. 'core/bold').
 *
 * @return {Object} Action object.
 */
export function enableFormatTypeInBlock( blockName, formatName ) {
	return {
		type: 'ENABLE_FORMAT_TYPE_IN_BLOCK',
		blockName,
		formatName,
	};
}
