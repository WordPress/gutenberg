/**
 * Internal dependencies
 */
import {
	setBackgroundStyleDefaults,
	backgroundResetAllFilter,
	BACKGROUND_BLOCK_DEFAULT_VALUES,
} from '../background';

describe( 'background', () => {
	describe( 'backgroundResetAllFilter', () => {
		it( 'clears every background-owned value, including a custom legacy color.gradient', () => {
			const result = backgroundResetAllFilter( {
				backgroundColor: 'primary',
				gradient: 'vivid-cyan-blue',
				className: 'is-style-fancy has-background',
				style: {
					color: {
						text: 'var:preset|color|contrast',
						background: 'var:preset|color|base',
						gradient:
							'linear-gradient(135deg,rgb(100,100,200) 0%,rgb(200,100,100) 100%)',
					},
					spacing: { padding: '10px' },
					background: { backgroundImage: { url: 'image.png' } },
				},
			} );

			// Background color and gradient attributes are cleared.
			expect( result.backgroundColor ).toBeUndefined();
			expect( result.gradient ).toBeUndefined();

			// The legacy `color.gradient` (a raw/custom value) is cleared. This
			// is the regression guard: it was previously kept for blocks
			// without `background.gradient` support.
			expect( result.style?.color?.gradient ).toBeUndefined();
			expect( result.style?.color?.background ).toBeUndefined();
			expect( result.style?.background ).toBeUndefined();

			// Unrelated styles are preserved.
			expect( result.style?.color?.text ).toBe(
				'var:preset|color|contrast'
			);
			expect( result.style?.spacing ).toEqual( { padding: '10px' } );

			// The `has-background` class is removed, other classes remain.
			expect( result.className ).toBe( 'is-style-fancy' );
		} );

		it( 'drops className entirely when has-background was its only value', () => {
			const result = backgroundResetAllFilter( {
				className: 'has-background',
				style: {
					color: { gradient: 'linear-gradient(0deg,#000,#fff)' },
				},
			} );
			expect( result.className ).toBeUndefined();
		} );

		it( 'leaves className untouched when has-background is not present', () => {
			const result = backgroundResetAllFilter( {
				className: 'is-style-fancy',
				style: {},
			} );
			expect( result.className ).toBe( 'is-style-fancy' );
		} );
	} );

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
