export function filterFonts( fonts, filters ) {
	const { category, search } = filters;
	let filteredFonts = fonts || [];

	if ( category && category !== 'all' ) {
		filteredFonts = filteredFonts.filter(
			( font ) => font.category === category
		);
	}

	if ( search ) {
		filteredFonts = filteredFonts.filter( ( font ) =>
			font.name.toLowerCase().includes( search.toLowerCase() )
		);
	}

	return filteredFonts;
}

export function filterFakeFacesFromFamilies( fonts ) {
	return fonts.reduce( ( acc, font ) => {
		const { fontFace, ...filteredFont } = font;
		const filteredFaces = fontFace.filter( ( face ) => ! face.fake );
		if ( filteredFaces.length ) {
			filteredFont.fontFace = filteredFaces;
		}
		return [ ...acc, filteredFont ];
	}, [] );
}
