/**
 * WordPress dependencies
 */
import { privateApis as syncPrivateApis } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { getSyncManager, hasSyncManager } from '../sync';
import { unlock } from '../lock-unlock';

const { createSyncManager, hasProviderCreators } = unlock( syncPrivateApis );

jest.mock( '@wordpress/sync', () => ( {
	privateApis: {
		createSyncManager: jest.fn(),
		hasProviderCreators: jest.fn(),
	},
} ) );

jest.mock( '../lock-unlock', () => ( {
	unlock: ( privateApis ) => privateApis,
} ) );

describe( 'getSyncManager', () => {
	it( 'only creates a sync manager when a provider is available', () => {
		const manager = {};
		createSyncManager.mockReturnValue( manager );
		hasProviderCreators.mockReturnValue( false );

		expect( getSyncManager() ).toBeUndefined();
		expect( hasSyncManager() ).toBe( false );
		expect( createSyncManager ).not.toHaveBeenCalled();

		hasProviderCreators.mockReturnValue( true );

		expect( getSyncManager() ).toBe( manager );
		expect( hasSyncManager() ).toBe( true );
		expect( createSyncManager ).toHaveBeenCalledTimes( 1 );
	} );
} );
