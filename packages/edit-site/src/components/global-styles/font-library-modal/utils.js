/**
 * Internal dependencies
 */
import { FONT_WEIGHTS, FONT_STYLES } from './constants';

export function setUIValuesNeeded( font, extraValues = {} ) {
	if ( ! font.name ) {
		font.name = font.fontFamily || font.slug;
	}
	return {
		...font,
		...extraValues,
	};
}

export function isUrlEncoded( url ) {
	if ( typeof uri !== 'string' ) {
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

function mergeFontFaces ( existing, incoming ) {
	const map = new Map();
	for ( const face of existing ) {
		map.set( `${ face.fontWeight }${ face.fontStyle }`, face );
	}
	for ( const face of incoming ) {
		map.set( `${ face.fontWeight }${ face.fontStyle }`, face ); // This will overwrite if the src already exists, keeping it unique
	}
	return Array.from( map.values() );
};

export function mergeFontFamilies( existing = [], incoming = [] ) {
	const map = new Map();

	// Process the first array
	for ( const font of existing ) {
		map.set( font.slug, { ...font } );
	}

	// Process the second array
	for ( const font of incoming ) {
		if ( map.has( font.slug ) ) {
			const existingFont = map.get( font.slug );
			existingFont.fontFace = mergeFontFaces(
				existingFont.fontFace,
				font.fontFace
			);
		} else {
			map.set( font.slug, { ...font } );
		}
	}

	return Array.from( map.values() );
}
