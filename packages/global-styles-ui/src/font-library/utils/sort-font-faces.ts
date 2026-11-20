import type { FontFace } from '@wordpress/core-data';

function getNumericFontWeight( value: string ): number {
	switch ( value ) {
		case 'normal':
			return 400;
		case 'bold':
			return 700;
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
			const aWeight = getNumericFontWeight(
				a.fontWeight?.toString() ?? 'normal'
			);
			const bWeight = getNumericFontWeight(
				b.fontWeight?.toString() ?? 'normal'
			);

			if ( Number.isNaN( aWeight ) || Number.isNaN( bWeight ) ) {
				return (
					Number( Number.isNaN( aWeight ) ) -
					Number( Number.isNaN( bWeight ) )
				);
			}

			return aWeight - bWeight;
		}

		// Sort other fontStyles alphabetically
		if ( ! a.fontStyle || ! b.fontStyle ) {
			return ! a.fontStyle ? 1 : -1;
		}

		return a.fontStyle.localeCompare( b.fontStyle );
	} );
}
