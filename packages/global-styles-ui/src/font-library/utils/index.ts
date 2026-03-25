/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import type { FontFamily, FontFace } from '@wordpress/core-data';
import type { DataRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { FONT_WEIGHTS, FONT_STYLES } from './constants';
import { fetchInstallFontFace } from '../api';
import type { FontFamilyToUpload, FontUploadResult } from '../types';
import { unlock } from '../../lock-unlock';

/**
 * Browser dependencies
 */
const { File } = window;
const { kebabCase } = unlock( componentsPrivateApis );

export function setUIValuesNeeded(
	font: FontFamily,
	extraValues: Partial< FontFamily > = {}
): FontFamily {
	if ( ! font.name && ( font.fontFamily || font.slug ) ) {
		font.name = font.fontFamily || font.slug;
	}
	return {
		...font,
		...extraValues,
	};
}

export function isUrlEncoded( url: string ): boolean {
	if ( typeof url !== 'string' ) {
		return false;
	}
	return url !== decodeURIComponent( url );
}

export function getFontFaceVariantName( face: FontFace ): string {
	const weightName = FONT_WEIGHTS[ face.fontWeight ?? '' ] || face.fontWeight;
	const styleName =
		face.fontStyle === 'normal'
			? ''
			: FONT_STYLES[ face.fontStyle ?? '' ] || face.fontStyle;
	return `${ weightName } ${ styleName }`;
}

export function mergeFontFaces(
	existing: FontFace[] = [],
	incoming: FontFace[] = []
): FontFace[] {
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

export function mergeFontFamilies(
	existing: FontFamily[] = [],
	incoming: FontFamily[] = []
): FontFamily[] {
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

/**
 * Construct a quoted CSS String from a plain JavaScript value.
 *
 * @param value The JavaScript string to serialize as a quoted CSS string.
 * @return A quoted, CSS-safe font-family string.
 */
export function createCssString( value: string ): string {
	return `"${ value
		.trim()

		/*
		 * CSS Unicode escaping for problematic characters.
		 * https://www.w3.org/TR/css-syntax-3/#escaping
		 *
		 * These characters are not required by CSS but may be problematic in WordPress:
		 *
		 * - Normalize and replace newlines. https://www.w3.org/TR/css-syntax-3/#input-preprocessing
		 * - "<", ">", and "&" are replaced to prevent issues with KSES and other sanitization that
		 *   is confused by HTML-like text.
		 * - CSS syntax characters are replaced to prevent issues where CSS may be processed by simple
		 *   string splits or search and replaces: "',;{}
		 *
		 * Note that the Unicode escape sequences are used rather than backslash-escaping so the
		 * problematic characters are removed completely. CSS Unicode escapes are formed by a
		 * "\" followed by the the character code in hexadecimal. The escape may be terminated by
		 * whitespace which is ignored.
		 */
		// Escape existing backslashes before any other processing.
		.replaceAll( '\\', '\\5C ' )

		// Pre-processing replaces NULLs and some newlines. Replace and escape as necessary.
		.replaceAll( '\0', '\uFFFD' )

		// Carriage return + line feed must be the first newline replacement.
		.replaceAll( '\r\n', '\\A ' )
		.replaceAll( '\r', '\\A ' )
		.replaceAll( '\f', '\\A ' )

		// Newlines must be escaped.
		.replaceAll( '\n', '\\A ' )

		// HTML syntax may be problematic.
		.replaceAll( '<', '\\3C ' )
		.replaceAll( '>', '\\3E ' )
		.replaceAll( '&', '\\26 ' )

		// CSS syntax may be problematic.
		.replaceAll( ',', '\\2C ' )
		.replaceAll( ';', '\\3B ' )
		.replaceAll( '{', '\\7B ' )
		.replaceAll( '}', '\\7D ' )
		.replaceAll( '"', '\\22 ' )
		.replaceAll( "'", '\\27 ' ) }"`;
}

let documentSheet: CSSStyleSheet | undefined;
let iframeSheetDoc: Document | undefined;
let iframeSheetInstance: CSSStyleSheet | undefined;

/**
 * Returns managed CSSStyleSheets for the requested targets, lazily creating
 * and adopting them as needed. Uses the iframe's own CSSStyleSheet constructor
 * so the sheet belongs to the correct document realm.
 *
 * @param target Which documents to provide sheets for.
 * @return The managed stylesheets for the requested targets.
 */
function ensureTargetSheets(
	target: 'all' | 'document' | 'iframe'
): CSSStyleSheet[] {
	const sheets: CSSStyleSheet[] = [];

	if ( target === 'document' || target === 'all' ) {
		if ( ! documentSheet ) {
			documentSheet = new CSSStyleSheet();
		}
		if ( ! document.adoptedStyleSheets.includes( documentSheet ) ) {
			document.adoptedStyleSheets.push( documentSheet );
		}
		sheets.push( documentSheet );
	}

	if ( target === 'iframe' || target === 'all' ) {
		const iframe = document.querySelector< HTMLIFrameElement >(
			'iframe[name="editor-canvas"]'
		);
		const iframeDoc = iframe?.contentDocument;
		const iframeGlobal = iframeDoc?.defaultView;

		if ( iframeDoc && iframeGlobal ) {
			// Recreate sheet when iframe document changes (e.g. navigation).
			// Use the iframe's own CSSStyleSheet constructor so the sheet
			// belongs to the iframe's document realm (spec requirement).
			if ( iframeDoc !== iframeSheetDoc || ! iframeSheetInstance ) {
				iframeSheetInstance = new iframeGlobal.CSSStyleSheet();
				iframeSheetDoc = iframeDoc;
			}
			if (
				! iframeDoc.adoptedStyleSheets.includes( iframeSheetInstance )
			) {
				iframeDoc.adoptedStyleSheets.push( iframeSheetInstance );
			}
			sheets.push( iframeSheetInstance );
		}
	}

	return sheets;
}

/**
 * Builds a CSSFontFaceRule from a FontFace descriptor by inserting into
 * a temporary stylesheet. Returns null if the CSS is invalid.
 *
 * @param fontFace The font face descriptor to convert.
 * @param src      Optional URL to use as the font source.
 * @return The constructed rule, or null on invalid CSS.
 */
function getCssFontFaceRule(
	fontFace: FontFace,
	src?: string
): CSSFontFaceRule | null {
	const declarations = [
		`font-family: ${ fontFace.fontFamily }`,
		`font-style: ${ fontFace.fontStyle || 'normal' }`,
		`font-weight: ${ fontFace.fontWeight || '400' }`,
	];

	if ( src ) {
		declarations.push( `src: url( ${ createCssString( src ) } )` );
	}
	if ( fontFace.fontDisplay ) {
		declarations.push( `font-display: ${ fontFace.fontDisplay }` );
	}
	if ( fontFace.fontStretch ) {
		declarations.push( `font-stretch: ${ fontFace.fontStretch }` );
	}
	if ( fontFace.fontVariant ) {
		declarations.push( `font-variant: ${ fontFace.fontVariant }` );
	}
	if ( fontFace.fontFeatureSettings ) {
		declarations.push(
			`font-feature-settings: ${ fontFace.fontFeatureSettings }`
		);
	}
	if ( fontFace.fontVariationSettings ) {
		declarations.push(
			`font-variation-settings: ${ fontFace.fontVariationSettings }`
		);
	}
	if ( fontFace.unicodeRange ) {
		declarations.push( `unicode-range: ${ fontFace.unicodeRange }` );
	}

	const ss = new CSSStyleSheet();

	const cssText = `@font-face {\n\t${ declarations.join( ';\n\t' ) }\n}`;
	let ruleIndex: number;
	try {
		ruleIndex = ss.insertRule( cssText );
	} catch {
		// Invalid CSS, cannot produce a valid rule.
		if ( globalThis.SCRIPT_DEBUG ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to insert rule:\n%s', cssText );
		}
		return null;
	}
	const rule = ss.cssRules[ ruleIndex ];
	if ( rule instanceof CSSFontFaceRule ) {
		return rule;
	}
	// Unexpected rule
	if ( globalThis.SCRIPT_DEBUG ) {
		// eslint-disable-next-line no-console
		console.error( 'Unexpected rule type:\n%o', rule );
	}
	return null;
}

/**
 * Loads a font face into the browser by inserting an @font-face rule
 * into managed CSSStyleSheets, including the editor iframe.
 *
 * @param fontFace The font face descriptor to load.
 * @param source   URL string or File to use as the font source.
 * @param addTo    Which documents to add the font to.
 */
export function loadFontFaceInBrowser(
	fontFace: FontFace,
	source: string | File,
	addTo: 'all' | 'document' | 'iframe' = 'all'
): void {
	let src: string;
	if ( typeof source === 'string' ) {
		src = source;
	} else if ( source instanceof File ) {
		src = URL.createObjectURL( source );
	} else {
		return;
	}

	const rule = getCssFontFaceRule( fontFace, src );
	if ( ! rule ) {
		return;
	}

	for ( const sheet of ensureTargetSheets( addTo ) ) {
		sheet.insertRule( rule.cssText, sheet.cssRules.length );
	}
}

/**
 * Unloads a font face by deleting matching @font-face rules
 * from the managed CSSStyleSheets.
 *
 * @param fontFace   The font face descriptor to unload.
 * @param removeFrom Which documents to remove the font from.
 */
export function unloadFontFaceInBrowser(
	fontFace: FontFace,
	removeFrom: 'all' | 'document' | 'iframe' = 'all'
): void {
	const fontFaceRule = getCssFontFaceRule( fontFace );
	if ( ! fontFaceRule ) {
		return;
	}

	for ( const sheet of ensureTargetSheets( removeFrom ) ) {
		// Walk rules in reverse to safely delete by index.
		ruleLoop: for ( let i = sheet.cssRules.length - 1; i >= 0; i-- ) {
			const rule = sheet.cssRules[ i ];
			if ( rule instanceof CSSFontFaceRule ) {
				// Check for a match
				for ( const [ descriptor, value ] of Object.entries(
					fontFaceRule.style
				) ) {
					if ( value && rule.style[ descriptor as any ] !== value ) {
						continue ruleLoop;
					}
				}
				sheet.deleteRule( i );
				break;
			}
		}
	}
}

/**
 * Retrieves the display source from a font face src.
 *
 * @param {string|string[]} input - The font face src.
 * @return {string|undefined} The display source or undefined if the input is invalid.
 */
export function getDisplaySrcFromFontFace(
	input: string | string[]
): string | undefined {
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

export function makeFontFamilyFormData( fontFamily: FontFamily ): FormData {
	const formData = new FormData();

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

export function makeFontFacesFormData( font: FontFamilyToUpload ): FormData[] {
	const fontFacesFormData = ( font?.fontFace ?? [] ).map(
		( item, faceIndex ) => {
			const face = { ...item };
			const formData = new FormData();
			if ( face.file ) {
				// Normalize to an array, since face.file may be a single file or an array of files.
				const files = Array.isArray( face.file )
					? face.file
					: [ face.file ];
				const src: string[] = [];

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
		}
	);

	return fontFacesFormData;
}

export async function batchInstallFontFaces(
	fontFamilyId: string,
	fontFacesData: FormData[],
	registry: DataRegistry
): Promise< FontUploadResult > {
	const responses: {
		status: 'fulfilled' | 'rejected';
		value?: FontFace;
		reason?: Error;
	}[] = [];

	/*
	 * Uses the same response format as Promise.allSettled, but executes requests in sequence to work
	 * around a race condition that can cause an error when the fonts directory doesn't exist yet.
	 */
	for ( const faceData of fontFacesData ) {
		try {
			const response = await fetchInstallFontFace(
				fontFamilyId,
				faceData,
				registry
			);
			responses.push( { status: 'fulfilled', value: response } );
		} catch ( error ) {
			responses.push( { status: 'rejected', reason: error as Error } );
		}
	}

	const results: {
		successes: FontFace[];
		errors: Array< {
			data: FormData;
			message: string;
		} >;
	} = {
		errors: [],
		successes: [],
	};

	responses.forEach( ( result, index ) => {
		if ( result.status === 'fulfilled' && result.value ) {
			const response = result.value;
			results.successes.push( response );
		} else if ( result.reason ) {
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
export async function downloadFontFaceAssets(
	src: string | string[]
): Promise< File | File[] > {
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
					const filename = url.split( '/' ).pop() as string;
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
export function checkFontFaceInstalled(
	fontFace: FontFace,
	collection: FontFace[]
): boolean {
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
