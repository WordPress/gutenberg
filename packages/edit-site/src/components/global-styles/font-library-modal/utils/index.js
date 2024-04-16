/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { FONT_WEIGHTS, FONT_STYLES } from './constants';
import { unlock } from '../../../../lock-unlock';
import { fetchInstallFontFace } from '../resolvers';
import { formatFontFaceName } from './preview-styles';

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
	} else {
		return;
	}

	const newFont = new window.FontFace(
		formatFontFaceName( fontFace.fontFamily ),
		dataSource,
		{
			style: fontFace.fontStyle,
			weight: fontFace.fontWeight,
		}
	);

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

/*
 * Unloads the font face and remove it from the browser.
 * It also removes it from the iframe document.
 *
 * Note that Font faces that were added to the set using the CSS @font-face rule
 * remain connected to the corresponding CSS, and cannot be deleted.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/delete.
 */
export function unloadFontFaceInBrowser( fontFace, removeFrom = 'all' ) {
	const unloadFontFace = ( fonts ) => {
		fonts.forEach( ( f ) => {
			if (
				f.family === formatFontFaceName( fontFace?.fontFamily ) &&
				f.weight === fontFace?.fontWeight &&
				f.style === fontFace?.fontStyle
			) {
				fonts.delete( f );
			}
		} );
	};

	if ( removeFrom === 'document' || removeFrom === 'all' ) {
		unloadFontFace( document.fonts );
	}

	if ( removeFrom === 'iframe' || removeFrom === 'all' ) {
		const iframeDocument = document.querySelector(
			'iframe[name="editor-canvas"]'
		).contentDocument;
		unloadFontFace( iframeDocument.fonts );
	}
}

/**
 * Retrieves the display source from a font face src.
 *
 * @param {string|string[]} input - The font face src.
 * @return {string|undefined} The display source or undefined if the input is invalid.
 */
export function getDisplaySrcFromFontFace( input ) {
	if ( ! input ) {
		return;
	}

	let src;
	if ( Array.isArray( input ) ) {
		src = input[ 0 ];
	} else {
		src = input;
	}
	// It's expected theme fonts will already be loaded in the browser.
	if ( src.startsWith( 'file:.' ) ) {
		return;
	}
	if ( ! isUrlEncoded( src ) ) {
		src = encodeURI( src );
	}
	return src;
}

export function makeFontFamilyFormData( fontFamily ) {
	const formData = new FormData();
	const { kebabCase } = unlock( componentsPrivateApis );

	const { fontFace, category, ...familyWithValidParameters } = fontFamily;
	const fontFamilySettings = {
		...familyWithValidParameters,
		slug: kebabCase( fontFamily.slug ),
	};

	formData.append(
		'font_family_settings',
		JSON.stringify( fontFamilySettings )
	);
	return formData;
}

export function makeFontFacesFormData( font ) {
	if ( font?.fontFace ) {
		const fontFacesFormData = font.fontFace.map( ( item, faceIndex ) => {
			const face = { ...item };
			const formData = new FormData();
			if ( face.file ) {
				// Normalize to an array, since face.file may be a single file or an array of files.
				const files = Array.isArray( face.file )
					? face.file
					: [ face.file ];
				const src = [];

				files.forEach( ( file, key ) => {
					// Slugified file name because the it might contain spaces or characters treated differently on the server.
					const fileId = `file-${ faceIndex }-${ key }`;
					// Add the files to the formData
					formData.append( fileId, file, file.name );
					src.push( fileId );
				} );

				face.src = src.length === 1 ? src[ 0 ] : src;
				delete face.file;

				formData.append( 'font_face_settings', JSON.stringify( face ) );
			} else {
				formData.append( 'font_face_settings', JSON.stringify( face ) );
			}
			return formData;
		} );

		return fontFacesFormData;
	}
}

export async function batchInstallFontFaces( fontFamilyId, fontFacesData ) {
	const responses = [];

	/*
	 * Uses the same response format as Promise.allSettled, but executes requests in sequence to work
	 * around a race condition that can cause an error when the fonts directory doesn't exist yet.
	 */
	for ( const faceData of fontFacesData ) {
		try {
			const response = await fetchInstallFontFace(
				fontFamilyId,
				faceData
			);
			responses.push( { status: 'fulfilled', value: response } );
		} catch ( error ) {
			responses.push( { status: 'rejected', reason: error } );
		}
	}

	const results = {
		errors: [],
		successes: [],
	};

	responses.forEach( ( result, index ) => {
		if ( result.status === 'fulfilled' ) {
			const response = result.value;
			if ( response.id ) {
				results.successes.push( response );
			} else {
				results.errors.push( {
					data: fontFacesData[ index ],
					message: `Error: ${ response.message }`,
				} );
			}
		} else {
			// Handle network errors or other fetch-related errors
			results.errors.push( {
				data: fontFacesData[ index ],
				message: result.reason.message,
			} );
		}
	} );

	return results;
}

/*
 * Downloads a font face asset from a URL to the client and returns a File object.
 */
export async function downloadFontFaceAssets( src ) {
	// Normalize to an array, since `src` could be a string or array.
	src = Array.isArray( src ) ? src : [ src ];

	const files = await Promise.all(
		src.map( async ( url ) => {
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
				} );
		} )
	);

	// If we only have one file return it (not the array).  Otherwise return all of them in the array.
	return files.length === 1 ? files[ 0 ] : files;
}

/*
 * Determine if a given Font Face is present in a given collection.
 * We determine that a font face has been installed by comparing the fontWeight and fontStyle
 *
 * @param {Object} fontFace The Font Face to seek
 * @param {Array} collection The Collection to seek in
 * @returns True if the font face is found in the collection.  Otherwise False.
 */
export function checkFontFaceInstalled( fontFace, collection ) {
	return (
		-1 !==
		collection.findIndex( ( collectionFontFace ) => {
			return (
				collectionFontFace.fontWeight === fontFace.fontWeight &&
				collectionFontFace.fontStyle === fontFace.fontStyle
			);
		} )
	);
}
