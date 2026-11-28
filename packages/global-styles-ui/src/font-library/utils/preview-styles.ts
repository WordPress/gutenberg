import type { CSSProperties } from 'react';
import type { FontFace, FontFamily } from '@wordpress/core-data';

function findNearest( input: number, numbers: number[] ) {
	// If the numbers array is empty, return null
	if ( numbers.length === 0 ) {
		return null;
	}
	// Sort the array based on the absolute difference with the input
	numbers.sort( ( a, b ) => Math.abs( input - a ) - Math.abs( input - b ) );
	// Return the first element (which will be the nearest) from the sorted array
	return numbers[ 0 ];
}

const FONT_WEIGHT_KEYWORDS: Record< string, number | undefined > = {
	normal: 400,
	bold: 700,
};

function isValidWeight( weight: number | undefined ): weight is number {
	return (
		weight !== undefined &&
		Number.isFinite( weight ) &&
		weight >= 1 &&
		weight <= 1000
	);
}

/*
 * Resolve a font-weight range (e.g. "200 900") to a single value.
 * Ranges that cover 400 resolve to 400; otherwise to the closest end.
 */
function resolveFontWeight( fontWeight: FontFace[ 'fontWeight' ] ): string {
	const weights = String( fontWeight ?? '' )
		.trim()
		.toLowerCase()
		.split( /\s+/ )
		.filter( Boolean )
		.map( ( value ) => FONT_WEIGHT_KEYWORDS[ value ] ?? Number( value ) );

	const [ start, end ] = weights;

	if ( ! isValidWeight( start ) ) {
		return '400';
	}

	if ( weights.length !== 2 || ! isValidWeight( end ) ) {
		return String( start );
	}

	return String( Math.min( Math.max( 400, start ), end ) );
}

/*
 * Format the font family to use in the CSS font-family property of a CSS rule.
 *
 * The input can be a string with the font family name or a string with multiple font family names separated by commas.
 * It follows the recommendations from the CSS Fonts Module Level 4.
 * https://www.w3.org/TR/css-fonts-4/#font-family-prop
 *
 * @param {string} input - The font family.
 * @return {string} The formatted font family.
 *
 * Example:
 * formatFontFamily( "Open Sans, Font+Name, sans-serif" ) => '"Open Sans", "Font+Name", sans-serif'
 * formatFontFamily( "'Open Sans', generic(kai), sans-serif" ) => '"Open Sans", generic(kai), sans-serif'
 * formatFontFamily( "DotGothic16, Slabo 27px, serif" ) => '"DotGothic16", "Slabo 27px", serif'
 * formatFontFamily( "Mine's, Moe's Typography" ) => `"Mine's", "Moe's Typography"`
 * formatFontFamily( "var(--my-font), sans-serif" ) => 'var(--my-font), sans-serif'
 */
export function formatFontFamily( input: string ) {
	// Matches anything that has to be quoted to be a valid font family name.
	// Left alone: a bare run of letters and hyphens, which covers the generic
	// keywords such as `sans-serif`; `generic(kai)`; and a reference to a
	// custom property such as `var(--wp--preset--font-family--body)`. The last
	// two are CSS function calls rather than names, so quoting either one
	// would stop it resolving.
	// TODO: The regex was scoped to `var(--name )` and not things like `var(--name, fallback)`. That'll require more string parsing.
	const regex =
		/^(?!generic\([ a-zA-Z\-]+\)$)(?!var\(\s*--[\w-]+\s*\)$)(?!^[a-zA-Z\-]+$).+/;
	const output = input.trim();

	const formatItem = ( item: string ) => {
		item = item.trim();
		if ( item.match( regex ) ) {
			// removes leading and trailing quotes.
			item = item.replace( /^["']|["']$/g, '' );
			return `"${ item }"`;
		}
		return item;
	};

	if ( output.includes( ',' ) ) {
		return output
			.split( ',' )
			.map( formatItem )
			.filter( ( item ) => item !== '' )
			.join( ', ' );
	}

	return formatItem( output );
}

/*
 * Format the font face name to use in the font-family property of a font face.
 *
 * The input can be a string with the font face name or a string with multiple font face names separated by commas.
 * It removes the leading and trailing quotes from the font face name.
 *
 * @param {string} input - The font face name.
 * @return {string} The formatted font face name.
 *
 * Example:
 * formatFontFaceName("Open Sans") => "Open Sans"
 * formatFontFaceName("'Open Sans', sans-serif") => "Open Sans"
 * formatFontFaceName(", 'Open Sans', 'Helvetica Neue', sans-serif") => "Open Sans"
 */
export function formatFontFaceName( input: string ) {
	if ( ! input ) {
		return '';
	}

	let output = input.trim();
	if ( output.includes( ',' ) ) {
		output = (
			output
				.split( ',' )
				// finds the first item that is not an empty string.
				.find( ( item ) => item.trim() !== '' ) ?? ''
		).trim();
	}
	// removes leading and trailing quotes.
	output = output.replace( /^["']|["']$/g, '' );

	// Firefox needs the font name to be wrapped in double quotes meanwhile other browsers don't.
	if ( window.navigator.userAgent.toLowerCase().includes( 'firefox' ) ) {
		output = `"${ output }"`;
	}
	return output;
}

export function getFamilyPreviewStyle(
	family: FontFamily | FontFace
): CSSProperties {
	const style: CSSProperties = {
		fontFamily: formatFontFamily( family.fontFamily ),
	};

	if ( ! ( 'fontFace' in family ) || ! Array.isArray( family.fontFace ) ) {
		style.fontWeight = '400';
		style.fontStyle = 'normal';
		return style;
	}

	if ( family.fontFace ) {
		//get all the font faces with normal style
		const normalFaces = family.fontFace.filter(
			( face ) =>
				face?.fontStyle && face.fontStyle.toLowerCase() === 'normal'
		);
		if ( normalFaces.length > 0 ) {
			style.fontStyle = 'normal';
			const normalWeights = normalFaces.map( ( face ) =>
				Number( resolveFontWeight( face.fontWeight ) )
			);
			style.fontWeight = String(
				findNearest( 400, normalWeights ) ?? 400
			);
		} else {
			style.fontStyle =
				( family.fontFace.length && family.fontFace[ 0 ].fontStyle ) ||
				'normal';
			style.fontWeight =
				( family.fontFace.length &&
					resolveFontWeight( family.fontFace[ 0 ].fontWeight ) ) ||
				'400';
		}
	}

	return style;
}

export function getFacePreviewStyle( face: FontFace ): CSSProperties {
	return {
		fontFamily: formatFontFamily( face.fontFamily ),
		fontStyle: face.fontStyle || 'normal',
		fontWeight: resolveFontWeight( face.fontWeight ),
	};
}
