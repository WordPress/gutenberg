/**
 * Internal dependencies
 */
import {
	isPluginItemPinned,
} from '../selectors';

describe( 'selectors', () => {
	describe( 'isPluginItemPinned', () => {
		const state = {
			preferences: {
				pinnedPluginItems: {
					'foo/pinned': true,
					'foo/unpinned': false,
				},
			},
		};

		it( 'should return true if the flag is not set for the plugin item', () => {
			expect( isPluginItemPinned( state, 'foo/unknown' ) ).toBe( true );
		} );

		it( 'should return true if plugin item is not pinned', () => {
			expect( isPluginItemPinned( state, 'foo/pinned' ) ).toBe( true );
		} );

		it( 'should return false if plugin item item is unpinned', () => {
			expect( isPluginItemPinned( state, 'foo/unpinned' ) ).toBe( false );
		} );
	} );
} );
