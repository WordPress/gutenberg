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
