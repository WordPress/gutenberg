/**
 * Reads the alternate sources out of the block's `fallbacks` attribute.
 *
 * Anything can end up in a saved attribute, because a post can be edited by
 * hand or written by another tool, so this keeps only what the list is
 * defined to hold: URLs, trimmed, in order, and once each. A URL listed twice
 * would be tried twice on the front end, and would show in the editor as two
 * rows nothing tells apart.
 *
 * The editor and the saved markup read the list through this function, so a
 * block saves the sources its panel showed.
 *
 * @param {unknown} fallbacks Stored attribute value.
 *
 * @return {string[]} Alternate source URLs.
 */
export function toSourceList( fallbacks ) {
	if ( ! Array.isArray( fallbacks ) ) {
		return [];
	}

	return fallbacks.reduce( ( sources, url ) => {
		const trimmed = typeof url === 'string' ? url.trim() : '';

		if ( trimmed && ! sources.includes( trimmed ) ) {
			sources.push( trimmed );
		}

		return sources;
	}, [] );
}
