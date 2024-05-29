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

export function isFontFontFaceInOutline( slug, face, outline ) {
	if ( ! face ) {
		return !! outline[ slug ];
	}
	return !! outline[ slug ]?.[ `${ face.fontStyle }-${ face.fontWeight }` ];
}
