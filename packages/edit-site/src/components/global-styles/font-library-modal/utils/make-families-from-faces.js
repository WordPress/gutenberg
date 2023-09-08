export default function makeFamiliesFromFaces( fontFaces ) {
	const fontFamiliesObject = fontFaces.reduce( ( acc, item ) => {
		if ( ! acc[ item.fontFamily ] ) {
			acc[ item.fontFamily ] = {
				name: item.fontFamily,
				fontFamily: item.fontFamily,
				slug: item.fontFamily.replace( /\s+/g, '-' ).toLowerCase(),
				fontFace: [],
			};
		}
		acc[ item.fontFamily ].fontFace.push( item );
		return acc;
	}, {} );
	return Object.values( fontFamiliesObject );
}
