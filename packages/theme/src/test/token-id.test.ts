/**
 * Internal dependencies
 */
import { publicTokenId } from '../token-id';

describe( 'publicTokenId', () => {
	it( 'should remove default states and visibility identifiers from the token id', () => {
		expect(
			publicTokenId( 'color.semantic.bg-surface.success.weak.resting' )
		).toBe( 'color.bg-surface.success.weak' );
	} );
} );
