/**
 * Internal dependencies
 */
import { activeModal } from '../reducer';

describe( 'state', () => {
	describe( 'activeModal', () => {
		it( 'should default to null', () => {
			const state = activeModal( undefined, {} );
			expect( state ).toBeNull();
		} );

		it( 'should set the activeModal to the provided name', () => {
			const state = activeModal( null, {
				type: 'OPEN_MODAL',
				name: 'test-modal',
			} );

			expect( state ).toEqual( 'test-modal' );
		} );

		it( 'should set the activeModal to null', () => {
			const state = activeModal( 'test-modal', {
				type: 'CLOSE_MODAL',
			} );

			expect( state ).toBeNull();
		} );
	} );
} );
