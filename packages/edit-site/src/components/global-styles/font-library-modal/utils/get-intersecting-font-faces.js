/**
 * Retrieves intersecting font faces between two sets of fonts.
 *
 * For each font in the `incoming` list, the function checks for a corresponding match
 * in the `existing` list based on the `slug` property. If a match is found and both
 * have `fontFace` properties, it further narrows down to matching font faces based on
 * the `fontWeight` and `fontStyle`. The result includes the properties of the matched
 * existing font but only with intersecting font faces.
 *
 * @param {Array.<{ slug: string, fontFace?: Array.<{ fontWeight: string, fontStyle: string }> }>} incoming - The list of fonts to compare.
 * @param {Array.<{ slug: string, fontFace?: Array.<{ fontWeight: string, fontStyle: string }> }>} existing - The reference list of fonts.
 *
 * @return {Array.<{ slug: string, fontFace?: Array.<{ fontWeight: string, fontStyle: string }> }>} An array of fonts from the `existing` list with intersecting font faces.
 *
 * @example
 * const incomingFonts = [
 *   { slug: 'arial', fontFace: [{ fontWeight: '400', fontStyle: 'normal' }] },
 *   { slug: 'times-new', fontFace: [{ fontWeight: '700', fontStyle: 'italic' }] }
 * ];
 *
 * const existingFonts = [
 *   { slug: 'arial', fontFace: [{ fontWeight: '400', fontStyle: 'normal' }, { fontWeight: '700', fontStyle: 'italic' }] },
 *   { slug: 'helvetica', fontFace: [{ fontWeight: '400', fontStyle: 'normal' }] }
 * ];
 *
 * getIntersectingFontFaces(incomingFonts, existingFonts);
 * // Returns:
 * // [{ slug: 'arial', fontFace: [{ fontWeight: '400', fontStyle: 'normal' }] }]
 */
export default function getIntersectingFontFaces( incoming, existing ) {
	const matches = [];

	for ( const incomingFont of incoming ) {
		const existingFont = existing.find(
			( f ) => f.slug === incomingFont.slug
		);

		if ( existingFont ) {
			if ( incomingFont?.fontFace ) {
				const matchingFaces = incomingFont.fontFace.filter(
					( face ) => {
						return ( existingFont?.fontFace || [] ).find( ( f ) => {
							return (
								f.fontWeight === face.fontWeight &&
								f.fontStyle === face.fontStyle
							);
						} );
					}
				);
				matches.push( { ...existingFont, fontFace: matchingFaces } );
			} else {
				matches.push( incomingFont );
			}
		}
	}

	return matches;
}
