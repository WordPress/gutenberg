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
		const backgroundStylesNoId = { backgroundImage: { id: 123 } };
		const backgroundStylesNoURL = { backgroundImage: { url: 'image.png' } };
		it.each( [
			[
				'return background size default',
				backgroundStyles,
				undefined,
				{
					backgroundSize:
						BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundSize,
				},
			],
			[
				'not apply default size value if one exists in inherited styles',
				backgroundStyles,
				{
					backgroundSize: 'auto',
				},
				undefined,
			],
			[
				'return early if no styles are passed',
				undefined,
				undefined,
				undefined,
			],
			[
				'return early if images has no id',
				backgroundStylesNoId,
				undefined,
				undefined,
			],
			[
				'return early if images has no URL',
				backgroundStylesNoURL,
				undefined,
				undefined,
			],
			[
				'return background position default',
				backgroundStylesContain,
				undefined,
				{
					backgroundPosition:
						BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundPosition,
				},
			],
			[
				'return background position default if inherited size is contain',
				backgroundStyles,
				{ backgroundSize: 'contain' },
				{
					backgroundPosition:
						BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundPosition,
				},
			],
			[
				'not apply background position when background size is not contain and inherited value is contain',
				{
					...backgroundStyles,
					backgroundSize: 'cover',
				},
				{ backgroundSize: 'contain' },
				undefined,
			],
			[
				'not apply background position value if one already exists in styles',
				{
					...backgroundStylesContain,
					backgroundPosition: 'center',
				},
				undefined,
				undefined,
			],
			[
				'not apply background position value if one exists in inherited styles',
				backgroundStylesContain,
				{ backgroundPosition: 'center' },
				undefined,
			],
		] )( 'should %s', ( message, styles, inheritedStyles, expected ) => {
			const result = setBackgroundStyleDefaults(
				styles,
				inheritedStyles
			);
			expect( result ).toEqual( expected );
		} );
	} );
} );
