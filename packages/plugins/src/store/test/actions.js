/**
 * Internal dependencies
 */
import {
	togglePinnedPluginItem,
} from '../actions';

describe( 'actions', () => {
	describe( 'togglePinnedPluginItem', () => {
		it( 'should return TOGGLE_PINNED_PLUGIN_ITEM action', () => {
			const itemName = 'foo/bar';

			expect( togglePinnedPluginItem( itemName ) ).toEqual( {
				type: 'TOGGLE_PINNED_PLUGIN_ITEM',
				itemName,
			} );
		} );
	} );
} );
