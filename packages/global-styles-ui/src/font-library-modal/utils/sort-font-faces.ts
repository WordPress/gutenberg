/**
 * Internal dependencies
 */
import type { FontFace } from '../types';

function getNumericFontWeight( value: string ): number {
	switch ( value ) {
		case 'normal':
			return 400;
		case 'bold':
			return 700;
		case 'bolder':
			return 500;
		case 'lighter':
			return 300;
		default:
			return parseInt( value, 10 );
	}
}

export function sortFontFaces( faces: FontFace[] ): FontFace[] {
	return faces.sort( ( a, b ) => {
		// Ensure 'normal' fontStyle is always first
		if ( a.fontStyle === 'normal' && b.fontStyle !== 'normal' ) {
			return -1;
		}
		if ( b.fontStyle === 'normal' && a.fontStyle !== 'normal' ) {
			return 1;
		}

		// If both fontStyles are the same, sort by fontWeight
		if ( a.fontStyle === b.fontStyle ) {
			return (
				getNumericFontWeight( a.fontWeight?.toString() ?? 'normal' ) -
				getNumericFontWeight( b.fontWeight?.toString() ?? 'normal' )
			);
		}

		// Sort other fontStyles alphabetically
		if ( ! a.fontStyle || ! b.fontStyle ) {
			return ! a.fontStyle ? 1 : -1;
		}

		return a.fontStyle.localeCompare( b.fontStyle );
	} );
}
