import type { Color } from '@wordpress/global-styles-engine';

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
