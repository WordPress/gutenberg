import { getAssociatedGuide, isTipVisible, areTipsEnabled } from '../selectors';

describe( 'selectors', () => {
	describe( 'getAssociatedGuide', () => {
		it( 'returns null', () => {
			expect( getAssociatedGuide( {}, 'test/tip' ) ).toBeNull();
		} );
	} );

	describe( 'isTipVisible', () => {
		it( 'returns false', () => {
			expect( isTipVisible( {}, 'test/tip' ) ).toBe( false );
		} );
	} );

	describe( 'areTipsEnabled', () => {
		it( 'returns false', () => {
			expect( areTipsEnabled( {} ) ).toBe( false );
		} );
	} );
} );
