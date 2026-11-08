import type { ScopePreferences } from '../../types';
import type { EditPostPanels, LegacyEditPostPanel } from './types';

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
 * @param preferences A preferences object.
 *
 * @return The converted data.
 */
export default function convertEditPostPanels(
	preferences: ScopePreferences
): EditPostPanels {
	const panels = ( preferences?.panels ?? {} ) as Record<
		string,
		LegacyEditPostPanel | undefined
	>;
	return Object.keys( panels ).reduce< EditPostPanels >(
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
