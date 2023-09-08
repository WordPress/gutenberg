export default function getIntersectingFontFaces(
	intendedFontsFamilies,
	existingFontFamilies
) {
	const matches = [];

	for ( const intendedFont of intendedFontsFamilies ) {
		const existingFont = existingFontFamilies.find(
			( f ) => f.slug === intendedFont.slug
		);

		if ( existingFont ) {
			if ( intendedFont?.fontFace ) {
				const matchingFaces = intendedFont.fontFace.filter(
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
				matches.push( intendedFont );
			}
		}
	}

	return matches;
}
