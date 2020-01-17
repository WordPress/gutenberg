/**
 * Internal dependencies
 */
import {
	getInstalledBlockTypes,
} from '../selectors';

describe( 'selectors', () => {
	describe( 'getInstalledBlockTypes', () => {
		it( 'should return an empty array as a default value', () => {
			const state = {
				blockManagement: { },
			};
			const installedBlockTypes = getInstalledBlockTypes( state );
			expect( installedBlockTypes ).toEqual( [] );
		} );

		it( 'should retrieve the blocks types that are installed', () => {
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
