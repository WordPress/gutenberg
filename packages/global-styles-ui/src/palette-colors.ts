import type { Color } from '@wordpress/global-styles-engine';

/**
 * Moves the background and text colors to the front of the palette so that
 * style variation previews show the main color scheme (e.g. light or dark)
 * first. Colors that are not in the palette are ignored, and the order of
 * the remaining colors is preserved.
 *
 * @param paletteColors   The palette colors to reorder.
 * @param backgroundColor The background color to place first.
 * @param textColor       The text color to place second.
 *
 * @return A new array with the background and text colors at the front.
 */
export function prioritizePaletteColors(
	paletteColors: Color[],
	backgroundColor: string,
	textColor: string
): Color[] {
	const prioritizedColors = [ ...paletteColors ];

	const moveColorToIndex = ( color: string, targetIndex: number ) => {
		const currentIndex = prioritizedColors.findIndex(
			( paletteColor ) => paletteColor.color === color
		);
		if ( currentIndex === -1 ) {
			return;
		}

		const [ paletteColor ] = prioritizedColors.splice( currentIndex, 1 );
		prioritizedColors.splice( targetIndex, 0, paletteColor );
	};

	moveColorToIndex( backgroundColor, 0 );
	if ( textColor !== backgroundColor ) {
		moveColorToIndex( textColor, 1 );
	}

	return prioritizedColors;
}
