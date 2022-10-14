/**
 * Internal dependencies
 */
import { isNumeric } from '../utils';

describe( 'isNumeric', () => {
	it.each( [
		[ 42, true ],
		[ '42', true ],
		[ '  42  ', true ],
		[ '', false ],
		[ 'some-slug', false ],
		[ 'some-42-slug-with-trailing-number-42', false ],
		[ '42-some-42-slug-with-leading-number', false ],
		[ NaN, false ],
		[ Infinity, false ],
	] )(
		'correctly determines variable type for "%s"',
		( candidate, expected ) => {
			expect( isNumeric( candidate ) ).toBe( expected );
		}
	);
} );
