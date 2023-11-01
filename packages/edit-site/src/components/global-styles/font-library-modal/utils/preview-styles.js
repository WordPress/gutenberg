function findNearest( input, numbers ) {
	// If the numbers array is empty, return null
	if ( numbers.length === 0 ) {
		return null;
	}
	// Sort the array based on the absolute difference with the input
	numbers.sort( ( a, b ) => Math.abs( input - a ) - Math.abs( input - b ) );
	// Return the first element (which will be the nearest) from the sorted array
	return numbers[ 0 ];
}

function extractFontWeights( fontFaces ) {
	const result = [];

	fontFaces.forEach( ( face ) => {
		const weights = String( face.fontWeight ).split( ' ' );

		if ( weights.length === 2 ) {
			const start = parseInt( weights[ 0 ] );
			const end = parseInt( weights[ 1 ] );

			for ( let i = start; i <= end; i += 100 ) {
				result.push( i );
			}
		} else if ( weights.length === 1 ) {
			result.push( parseInt( weights[ 0 ] ) );
		}
	} );

	return result;
}

export function formatFontFamily( input ) {
	return input
		.split( ',' )
		.map( ( font ) => {
			font = font.trim(); // Remove any leading or trailing white spaces
			// If the font doesn't have single quotes and contains a space, then add single quotes around it
			if ( ! font.startsWith( "'" ) && font.indexOf( ' ' ) !== -1 ) {
				return `'${ font }'`;
			}
			return font; // Return font as is if no transformation is needed
		} )
		.join( ', ' );
}

export function getFamilyPreviewStyle( family ) {
	const style = { fontFamily: formatFontFamily( family.fontFamily ) };

	if ( ! Array.isArray( family.fontFace ) ) {
		style.fontWeight = '400';
		style.fontStyle = 'normal';
		return style;
	}

	if ( family.fontFace ) {
		//get all the font faces with normal style
		const normalFaces = family.fontFace.filter(
			( face ) => face.fontStyle.toLowerCase() === 'normal'
		);
		if ( normalFaces.length > 0 ) {
			style.fontStyle = 'normal';
			const normalWeights = extractFontWeights( normalFaces );
			const nearestWeight = findNearest( 400, normalWeights );
			style.fontWeight = String( nearestWeight ) || '400';
		} else {
			style.fontStyle =
				( family.fontFace.length && family.fontFace[ 0 ].fontStyle ) ||
				'normal';
			style.fontWeight =
				( family.fontFace.length &&
					String( family.fontFace[ 0 ].fontWeight ) ) ||
				'400';
		}
	}

	return style;
}

export function getFacePreviewStyle( face ) {
	return {
		fontFamily: formatFontFamily( face.fontFamily ),
		fontStyle: face.fontStyle || 'normal',
		fontWeight: face.fontWeight || '400',
	};
}
