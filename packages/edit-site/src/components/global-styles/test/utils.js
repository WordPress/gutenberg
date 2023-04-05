/**
 * Internal dependencies
 */
import { isGlobalStyleConfigEqual } from '../utils';

describe( 'editor utils', () => {
	describe( 'isGlobalStyleConfigEqual', () => {
		test.each( [
			{ original: null, variation: null, expected: false },
			{ original: {}, variation: undefined, expected: false },
			{
				original: {
					styles: {
						color: { text: 'var(--wp--preset--color--red)' },
					},
				},
				variation: {
					styles: {
						color: { text: 'var(--wp--preset--color--blue)' },
					},
				},
				expected: false,
			},
			{ original: {}, variation: undefined, expected: false },
			{
				original: {
					styles: {
						color: { text: 'var(--wp--preset--color--red)' },
					},
					settings: {
						typography: {
							fontSize: true,
						},
					},
				},
				variation: {
					styles: {
						color: { text: 'var(--wp--preset--color--red)' },
					},
					settings: {
						typography: {
							fontSize: true,
						},
					},
				},
				expected: true,
			},
		] )(
			'.isGlobalStyleConfigEqual( $original, $variation )',
			( { original, variation, expected } ) => {
				expect( isGlobalStyleConfigEqual( original, variation ) ).toBe(
					expected
				);
			}
		);
	} );
} );
