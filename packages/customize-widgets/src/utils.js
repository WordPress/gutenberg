// @ts-check

/**
 * Convert settingId to widgetId.
 *
 * @param {string} settingId The setting id.
 * @return {string} The widget id.
 */
export function settingIdToWidgetId( settingId ) {
	const matches = settingId.match( /^widget_(.+)(?:\[(\d+)\])$/ );

	if ( matches ) {
		const idBase = matches[ 1 ];
		const number = parseInt( matches[ 2 ], 10 );

		return `${ idBase }-${ number }`;
	}

	return settingId;
}

/**
 * Get the internal widget id from block.
 *
 * @typedef  {Object} Attributes
 * @property {string} __internalWidgetId The intenral widget id.
 * @typedef  {Object} Block
 * @property {Attributes} attributes The attributes of the block.
 *
 * @param {Block} block The block.
 * @return {string} The internal widget id.
 */
export function getWidgetIdFromBlock( block ) {
	return block.attributes.__internalWidgetId;
}
