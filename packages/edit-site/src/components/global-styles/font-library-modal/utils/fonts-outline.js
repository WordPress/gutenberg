export function getFontsOutline( fonts ) {
	return fonts.reduce(
		( acc, font ) => ( {
			...acc,
			[ font.slug ]: ( font?.fontFace || [] ).reduce(
				( faces, face ) => ( {
					...faces,
					[ `${ face.fontStyle }-${ face.fontWeight }` ]: true,
				} ),
				{}
			),
		} ),
		{}
	);
}

export function getAvailableFontsOutline( availableFontFamilies ) {
	const outline = availableFontFamilies.reduce( ( acc, font ) => {
		const availableFontFaces =
			font?.fontFace && font.fontFace?.length > 0
				? font?.fontFace.map(
						( face ) => `${ face.fontStyle + face.fontWeight }`
				  )
				: [ 'normal400' ]; // If the font doesn't have fontFace, we assume it is a system font and we add the defaults: normal 400

		acc[ font.slug ] = availableFontFaces;
		return acc;
	}, {} );
	return outline;
}

export function isFontFontFaceInOutline( slug, face, outline ) {
	if ( ! face ) {
		return !! outline[ slug ];
	}
	return !! outline[ slug ]?.[ `${ face.fontStyle }-${ face.fontWeight }` ];
}
