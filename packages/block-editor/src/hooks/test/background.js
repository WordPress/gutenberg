/**
 * Internal dependencies
 */
import {
	setBackgroundStyleDefaults,
	BACKGROUND_BLOCK_DEFAULT_VALUES,
} from '../background';

describe( 'background', () => {
	describe( 'setBackgroundStyleDefaults', () => {
		const backgroundStyles = {
			backgroundImage: { id: 123, url: 'image.png' },
		};
		const backgroundStylesContain = {
			backgroundImage: { id: 123, url: 'image.png' },
			backgroundSize: 'contain',
		};
		const backgroundStylesNoURL = { backgroundImage: { id: 123 } };
		it.each( [
			[
				'return background size default',
				backgroundStyles,
				{
					backgroundSize:
						BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundSize,
				},
			],
			[ 'return early if no styles are passed', undefined, undefined ],
			[
				'return early if images has no id',
				backgroundStylesNoURL,
				undefined,
			],
			[
				'return early if images has no URL',
				backgroundStylesNoURL,
				undefined,
			],
			[
				'return background position default',
				backgroundStylesContain,
				{
					backgroundPosition:
						BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundPosition,
				},
			],
			[
				'not apply background position value if one already exists in styles',
				{
					...backgroundStylesContain,
					backgroundPosition: 'center',
				},
				undefined,
			],
		] )( 'should %s', ( message, styles, expected ) => {
			const result = setBackgroundStyleDefaults( styles );
			expect( result ).toEqual( expected );
		} );
	} );
} );
