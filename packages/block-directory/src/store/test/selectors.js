/**
 * Internal dependencies
 */
import { getInstalledBlockTypes } from '../selectors';

describe( 'selectors', () => {
	describe( 'getInstalledBlockTypes', () => {
		it( 'should retrieve the block types that are installed', () => {
			const blockTypes = [ 'fake-type' ];
			const state = {
				blockManagement: {
					installedBlockTypes: blockTypes,
				},
			};
			const installedBlockTypes = getInstalledBlockTypes( state );
			expect( installedBlockTypes ).toEqual( blockTypes );
		} );
	} );
} );
