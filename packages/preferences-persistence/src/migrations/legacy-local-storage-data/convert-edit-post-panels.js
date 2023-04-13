/**
 * Convert the post editor's panels state from:
 * ```
 * {
 *     panels: {
 *         tags: {
 *             enabled: true,
 *             opened: true,
 *         },
 *         permalinks: {
 *             enabled: false,
 *             opened: false,
 *         },
 *     },
 * }
 * ```
 *
 * to a new, more concise data structure:
 * {
 *     inactivePanels: [
 *         'permalinks',
 *     ],
 *     openPanels: [
 *         'tags',
 *     ],
 * }
 *
 * @param {Object} preferences A preferences object.
 *
 * @return {Object} The converted data.
 */
export default function convertEditPostPanels( preferences ) {
	const panels = preferences?.panels ?? {};
	return Object.keys( panels ).reduce(
		( convertedData, panelName ) => {
			const panel = panels[ panelName ];

			if ( panel?.enabled === false ) {
				convertedData.inactivePanels.push( panelName );
			}

			if ( panel?.opened === true ) {
				convertedData.openPanels.push( panelName );
			}

			return convertedData;
		},
		{ inactivePanels: [], openPanels: [] }
	);
}
