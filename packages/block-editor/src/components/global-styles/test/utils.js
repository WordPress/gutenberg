/**
 * Internal dependencies
 */
import { areGlobalStyleConfigsEqual } from '../utils';

describe( 'editor utils', () => {
	describe( 'areGlobalStyleConfigsEqual', () => {
		test.each( [
			{ original: null, variation: null, expected: true },
			{ original: {}, variation: {}, expected: true },
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
			'.areGlobalStyleConfigsEqual( $original, $variation )',
			( { original, variation, expected } ) => {
				expect(
					areGlobalStyleConfigsEqual( original, variation )
				).toBe( expected );
			}
		);
	} );
} );
