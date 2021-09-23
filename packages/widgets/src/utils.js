// @ts-check
/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Get the internal widget id from block.
 *
 * @typedef  {Object} Attributes
 * @property {string}     __internalWidgetId The internal widget id.
 * @typedef  {Object} Block
 * @property {Attributes} attributes         The attributes of the block.
 *
 * @param    {Block}      block              The block.
 * @return {string} The internal widget id.
 */
export function getWidgetIdFromBlock( block ) {
	return block.attributes.__internalWidgetId;
}

/**
 * Add internal widget id to block's attributes.
 *
 * @param {Block}  block    The block.
 * @param {string} widgetId The widget id.
 * @return {Block} The updated block.
 */
export function addWidgetIdToBlock( block, widgetId ) {
	return {
		...block,
		attributes: {
			...( block.attributes || {} ),
			__internalWidgetId: widgetId,
		},
	};
}

/**
 * Filters registered block settings, extending attributes to include
 * `borderColor` if needed.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Updated block settings.
 */
function addInternalWidgetIdAttribute( settings ) {
	return {
		...settings,
		attributes: {
			...settings.attributes,
			__internalWidgetId: {
				type: 'string',
				__experimentalRole: 'internal',
			},
		},
	};
}

export function registerInternalWidgetIds() {
	addFilter(
		'blocks.registerBlockType',
		'core/widget/addAttributes',
		addInternalWidgetIdAttribute
	);
}
