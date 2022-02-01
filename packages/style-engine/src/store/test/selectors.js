/**
 * Internal dependencies
 */
import {
	getStyleBySelector,
	getCssDefinitions,
	getConcatenatedCSSFromStyles,
} from '../selectors';

describe( 'selectors', () => {
	describe( 'getConcatenatedCSSFromStyles', () => {
		it( 'should return a concatenated CSS string', () => {
			const state = {
				'div > p strong.is-stormy': {
					fontWeight: 'bold',
					color: 'pink',
				},
			};
			expect( getConcatenatedCSSFromStyles( state ) ).toEqual(
				'div > p strong.is-stormy { font-weight: bold; color: pink }'
			);
		} );
	} );
} );
