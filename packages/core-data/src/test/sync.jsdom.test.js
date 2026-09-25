import { afterEach, describe, expect, it, vi } from 'vitest';
const { mockSyncManager, mockCreateSyncManager } = vi.hoisted( () => {
	const manager = {};
	return {
		mockSyncManager: manager,
		mockCreateSyncManager: vi.fn( () => manager ),
	};
} );

vi.mock( '@wordpress/sync', () => ( {
	privateApis: {
		createSyncManager: mockCreateSyncManager,
	},
} ) );

vi.mock( '../lock-unlock', () => ( {
	unlock: ( privateApis ) => privateApis,
} ) );

async function loadSync() {
	vi.resetModules();
	return import( '../sync' );
}

describe( 'getSyncManager', () => {
	afterEach( () => {
		delete window.__experimentalEnableRealTimeCollaboration;
		mockCreateSyncManager.mockClear();
	} );

	it.each( [ undefined, false ] )(
		'does not create a sync manager when the real-time collaboration flag is %s',
		async ( collaborationEnabled ) => {
			window.__experimentalEnableRealTimeCollaboration =
				collaborationEnabled;
			const { getSyncManager } = await loadSync();

			expect( getSyncManager() ).toBeUndefined();
			expect( mockCreateSyncManager ).not.toHaveBeenCalled();
		}
	);

	it( 'creates and reuses a sync manager when real-time collaboration is enabled', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const { getSyncManager } = await loadSync();

		expect( getSyncManager() ).toBe( mockSyncManager );
		expect( getSyncManager() ).toBe( mockSyncManager );
		expect( mockCreateSyncManager ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'returns an existing sync manager after real-time collaboration is disabled', async () => {
		window.__experimentalEnableRealTimeCollaboration = true;
		const { getSyncManager } = await loadSync();
		const existingSyncManager = getSyncManager();

		window.__experimentalEnableRealTimeCollaboration = false;

		expect( getSyncManager() ).toBe( existingSyncManager );
		expect( mockCreateSyncManager ).toHaveBeenCalledTimes( 1 );
	} );
} );
