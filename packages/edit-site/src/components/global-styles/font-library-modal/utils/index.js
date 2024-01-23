/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { FONT_WEIGHTS, FONT_STYLES } from './constants';
import { unlock } from '../../../../lock-unlock';

/**
 * Browser dependencies
 */
const { File } = window;

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

/*
 * Loads the font face from a URL and adds it to the browser.
 * It also adds it to the iframe document.
 */
export async function loadFontFaceInBrowser( fontFace, source, addTo = 'all' ) {
	let dataSource;

	if ( typeof source === 'string' ) {
		dataSource = `url(${ source })`;
		// eslint-disable-next-line no-undef
	} else if ( source instanceof File ) {
		dataSource = await source.arrayBuffer();
	}

	// eslint-disable-next-line no-undef
	const newFont = new FontFace( fontFace.fontFamily, dataSource, {
		style: fontFace.fontStyle,
		weight: fontFace.fontWeight,
	} );

	const loadedFace = await newFont.load();

	if ( addTo === 'document' || addTo === 'all' ) {
		document.fonts.add( loadedFace );
	}

	if ( addTo === 'iframe' || addTo === 'all' ) {
		const iframeDocument = document.querySelector(
			'iframe[name="editor-canvas"]'
		).contentDocument;
		iframeDocument.fonts.add( loadedFace );
	}
}

export function getDisplaySrcFromFontFace( input, urlPrefix ) {
	if ( ! input ) {
		return;
	}

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

export function makeFormDataFromFontFamily( fontFamily ) {
	const formData = new FormData();
	const { kebabCase } = unlock( componentsPrivateApis );

	const newFontFamily = {
		...fontFamily,
		slug: kebabCase( fontFamily.slug ),
	};

	if ( newFontFamily?.fontFace ) {
		const newFontFaces = newFontFamily.fontFace.map(
			( face, faceIndex ) => {
				if ( face.file ) {
					// Slugified file name because the it might contain spaces or characters treated differently on the server.
					const fileId = `file-${ faceIndex }`;
					// Add the files to the formData
					formData.append( fileId, face.file, face.file.name );
					// remove the file object from the face object the file is referenced by the uploadedFile key
					const { file, ...faceWithoutFileProperty } = face;
					const newFace = {
						...faceWithoutFileProperty,
						uploadedFile: fileId,
					};
					return newFace;
				}
				return face;
			}
		);
		newFontFamily.fontFace = newFontFaces;
	}

	formData.append( 'font_family_settings', JSON.stringify( newFontFamily ) );
	return formData;
}

/*
 * Downloads a font face asset from a URL to the client and returns a File object.
 */
export async function downloadFontFaceAsset( url ) {
	return fetch( new Request( url ) )
		.then( ( response ) => {
			if ( ! response.ok ) {
				throw new Error(
					`Error downloading font face asset from ${ url }. Server responded with status: ${ response.status }`
				);
			}
			return response.blob();
		} )
		.then( ( blob ) => {
			const filename = url.split( '/' ).pop();
			const file = new File( [ blob ], filename, {
				type: blob.type,
			} );
			return file;
		} )
		.catch( ( error ) => {
			// eslint-disable-next-line no-console
			console.error(
				`Error downloading font face asset from ${ url }:`,
				error
			);
			throw error;
		} );
}
