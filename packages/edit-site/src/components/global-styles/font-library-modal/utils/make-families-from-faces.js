export default function makeFamiliesFromFaces( fontFaces ) {
	const fontFamiliesObject = fontFaces.reduce( ( acc, item, i ) => {
		if ( ! acc[ item.fontFamily ] ) {
			acc[ item.fontFamily ] = {
				name: item.fontFamily,
				fontFamily: item.fontFamily,
				slug: item.fontFamily.replace( /\s+/g, '-' ).toLowerCase(),
				fontFace: [],
			};
		}
		if ( item.file ) {
			// Add the posted file id to the fontFace object
			// This is needed to associate the fontFace with the file on the server
			item.uploadedFile = `files${ i }`;
		}
		acc[ item.fontFamily ].fontFace.push( item );
		return acc;
	}, {} );
	return Object.values( fontFamiliesObject );
}
