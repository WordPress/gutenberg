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
