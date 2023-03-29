// @ts-check

/**
 * Get the internal widget id from block.
 *
 * @param {Object} block The block.
 * @return {string} The internal widget id.
 */
export function getWidgetIdFromBlock( block ) {
	return block.params.widgetId;
}

/**
 * Add internal widget id to block's attributes.
 *
 * @param {Object} block    The block.
 * @param {string} widgetId The widget id.
 * @return {Object} The updated block.
 */
export function addWidgetIdToBlock( block, widgetId ) {
	return {
		...block,
		params: {
			...block.params,
			widgetId,
		},
	};
}
