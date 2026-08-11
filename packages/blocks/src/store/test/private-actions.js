import { invalidateBlockBindingsSource } from '../private-actions';

describe( 'private actions', () => {
	describe( 'invalidateBlockBindingsSource', () => {
		it( 'should return an INVALIDATE_BLOCK_BINDINGS_SOURCE action with the given name', () => {
			expect( invalidateBlockBindingsSource( 'my/source' ) ).toEqual( {
				type: 'INVALIDATE_BLOCK_BINDINGS_SOURCE',
				name: 'my/source',
			} );
		} );

		it( 'should return an action with an undefined name when none is passed, to invalidate all sources', () => {
			expect( invalidateBlockBindingsSource() ).toEqual( {
				type: 'INVALIDATE_BLOCK_BINDINGS_SOURCE',
				name: undefined,
			} );
		} );
	} );
} );
