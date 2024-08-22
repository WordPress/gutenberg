/**
 * Internal dependencies
 */
import { reorder } from '../';

describe( 'reorder', () => {
	it.each( [ [ [ 1, 2, 3, 4 ], 0, 3, [ 2, 3, 4, 1 ] ] ] )(
		'reorders array',
		( list, srcIndex, destIndex, result ) => {
			expect( reorder( list, srcIndex, destIndex ) ).toStrictEqual(
				result
			);
		}
	);
} );
