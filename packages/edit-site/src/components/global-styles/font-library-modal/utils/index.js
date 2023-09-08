/**
 * Internal dependencies
 */
import { FONT_WEIGHTS, FONT_STYLES } from './constants';

export function setUIValuesNeeded( font, extraValues = {} ) {
	if ( ! font.name && ( font.fontFamily || font.slug ) ) {
		font.name = font.fontFamily || font.slug;
	}
	return {
		...font,
		...extraValues,
	};
}

export function isUrlEncoded( url ) {
	if ( typeof url !== 'string' ) {
		return false;
	}
	return url !== decodeURIComponent( url );
}

export function getFontFaceVariantName( face ) {
	const weightName = FONT_WEIGHTS[ face.fontWeight ] || face.fontWeight;
	const styleName =
		face.fontStyle === 'normal'
			? ''
			: FONT_STYLES[ face.fontStyle ] || face.fontStyle;
	return `${ weightName } ${ styleName }`;
}

export function mergeFontFaces( existing = [], incoming = [] ) {
	const map = new Map();
	for ( const face of existing ) {
		map.set( `${ face.fontWeight }${ face.fontStyle }`, face );
	}
	for ( const face of incoming ) {
		// This will overwrite if the src already exists, keeping it unique.
		map.set( `${ face.fontWeight }${ face.fontStyle }`, face );
	}
	return Array.from( map.values() );
}

export function mergeFontFamilies( existing = [], incoming = [] ) {
	const map = new Map();
	// Add the existing array to the map.
	for ( const font of existing ) {
		map.set( font.slug, { ...font } );
	}
	// Add the incoming array to the map, overwriting existing values excepting fontFace that need to be merged.
	for ( const font of incoming ) {
		if ( map.has( font.slug ) ) {
			const { fontFace: incomingFontFaces, ...restIncoming } = font;
			const existingFont = map.get( font.slug );
			// Merge the fontFaces existing with the incoming fontFaces.
			const mergedFontFaces = mergeFontFaces(
				existingFont.fontFace,
				incomingFontFaces
			);
			// Except for the fontFace key all the other keys are overwritten with the incoming values.
			map.set( font.slug, {
				...restIncoming,
				fontFace: mergedFontFaces,
			} );
		} else {
			map.set( font.slug, { ...font } );
		}
	}
	return Array.from( map.values() );
}

export async function loadFontFaceInBrowser( fontFace, src ) {
	// eslint-disable-next-line no-undef
	const newFont = new FontFace( fontFace.fontFamily, `url( ${ src } )`, {
		style: fontFace.fontStyle,
		weight: fontFace.fontWeight,
	} );
	const loadedFace = await newFont.load();
	document.fonts.add( loadedFace );
}

export function getDisplaySrcFromFontFace( input, urlPrefix ) {
	let src;
	if ( Array.isArray( input ) ) {
		src = input[ 0 ];
	} else {
		src = input;
	}
	// If it is a theme font, we need to make the url absolute
	if ( src.startsWith( 'file:.' ) && urlPrefix ) {
		src = src.replace( 'file:.', urlPrefix );
	}
	if ( ! isUrlEncoded( src ) ) {
		src = encodeURI( src );
	}
	return src;
}

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

export function getPreviewStyle( family ) {
	const style = { fontFamily: family.fontFamily };

	if ( ! Array.isArray( family.fontFace ) ) {
		style.fontWeight = '400';
		style.fontStyle = 'normal';
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
