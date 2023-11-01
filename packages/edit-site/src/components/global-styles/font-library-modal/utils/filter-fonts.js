export default function filterFonts( fonts, filters ) {
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
