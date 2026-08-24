const mockSyncManager = {};
const mockCreateManager = jest.fn( () => mockSyncManager );
const mockResolveEngineAdapter = jest.fn( () => ( {
	createManager: mockCreateManager,
} ) );

jest.mock( '@wordpress/sync', () => ( {
	privateApis: {
		resolveEngineAdapter: mockResolveEngineAdapter,
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
		mockResolveEngineAdapter.mockClear();
		mockCreateManager.mockClear();
	} );

	it.each( [ undefined, false ] )(
		'does not create a sync manager when the real-time collaboration flag is %s',
		( collaborationEnabled ) => {
			window.__experimentalEnableRealTimeCollaboration =
				collaborationEnabled;
			const { getSyncManager } = loadSync();

			expect( getSyncManager() ).toBeUndefined();
			expect( mockResolveEngineAdapter ).not.toHaveBeenCalled();
		}
	);

	it( 'creates and reuses a sync manager when real-time collaboration is enabled', () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const { getSyncManager } = loadSync();

		expect( getSyncManager() ).toBe( mockSyncManager );
		expect( getSyncManager() ).toBe( mockSyncManager );
		expect( mockCreateManager ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'returns an existing sync manager after real-time collaboration is disabled', () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const { getSyncManager } = loadSync();
		const existingSyncManager = getSyncManager();

		window.__experimentalEnableRealTimeCollaboration = false;

		expect( getSyncManager() ).toBe( existingSyncManager );
		expect( mockCreateManager ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'creates no sync manager and reports the engine as unavailable when no engine adapter resolves', () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		mockResolveEngineAdapter.mockReturnValueOnce( undefined );
		const { getSyncManager, isSyncEngineUnavailable } = loadSync();

		expect( getSyncManager() ).toBeUndefined();
		expect( isSyncEngineUnavailable() ).toBe( true );
		expect( mockCreateManager ).not.toHaveBeenCalled();
		expect( console ).toHaveWarned();
	} );
} );
