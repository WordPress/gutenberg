const mockSyncManager = {};
const mockCreateSyncManager = jest.fn( () => mockSyncManager );

jest.mock( '@wordpress/sync', () => ( {
	privateApis: {
		createSyncManager: mockCreateSyncManager,
	},
} ) );

jest.mock( '../lock-unlock', () => ( {
	unlock: ( privateApis ) => privateApis,
} ) );

function loadSync() {
	jest.resetModules();
	return require( '../sync' );
}

describe( 'getSyncManager', () => {
	afterEach( () => {
		delete window.__experimentalEnableRealTimeCollaboration;
		mockCreateSyncManager.mockClear();
	} );

	it.each( [ undefined, false ] )(
		'does not create a sync manager when the real-time collaboration flag is %s',
		( collaborationEnabled ) => {
			window.__experimentalEnableRealTimeCollaboration =
				collaborationEnabled;
			const { getSyncManager } = loadSync();

			expect( getSyncManager() ).toBeUndefined();
			expect( mockCreateSyncManager ).not.toHaveBeenCalled();
		}
	);

	it( 'creates and reuses a sync manager when real-time collaboration is enabled', () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const { getSyncManager } = loadSync();

		expect( getSyncManager() ).toBe( mockSyncManager );
		expect( getSyncManager() ).toBe( mockSyncManager );
		expect( mockCreateSyncManager ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'returns an existing sync manager after real-time collaboration is disabled', () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const { getSyncManager } = loadSync();
		const existingSyncManager = getSyncManager();

		window.__experimentalEnableRealTimeCollaboration = false;

		expect( getSyncManager() ).toBe( existingSyncManager );
		expect( mockCreateSyncManager ).toHaveBeenCalledTimes( 1 );
	} );
} );
