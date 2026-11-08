import { describe, expect, it, vi } from 'vitest';
import {
	PRELOAD_ERROR_RELOAD_GUARD_INTERVAL,
	handlePreloadError,
} from '../load-error-recovery';

function createStorage(
	reloadAttempt?: string
): Pick< Storage, 'getItem' | 'setItem' > {
	const values = new Map< string, string >();
	if ( reloadAttempt !== undefined ) {
		values.set( 'storybook-preload-error-reload-attempt', reloadAttempt );
	}

	return {
		getItem: vi.fn( ( key: string ) => values.get( key ) ?? null ),
		setItem: vi.fn( ( key: string, value: string ) => {
			values.set( key, value );
		} ),
	};
}

describe( 'handlePreloadError', () => {
	it( 'reloads the full Storybook page after the first preload error', () => {
		const event = { preventDefault: vi.fn() };
		const storage = createStorage();
		const reload = vi.fn();

		handlePreloadError( event, {
			now: 100_000,
			reload,
			storage,
		} );

		expect( storage.setItem ).toHaveBeenCalledWith(
			'storybook-preload-error-reload-attempt',
			'100000'
		);
		expect( event.preventDefault ).toHaveBeenCalledTimes( 1 );
		expect( reload ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'lets a repeated preload error surface instead of reloading again', () => {
		const event = { preventDefault: vi.fn() };
		const storage = createStorage( '100000' );
		const reload = vi.fn();

		handlePreloadError( event, {
			now: 100_001,
			reload,
			storage,
		} );

		expect( storage.setItem ).not.toHaveBeenCalled();
		expect( event.preventDefault ).not.toHaveBeenCalled();
		expect( reload ).not.toHaveBeenCalled();
	} );

	it( 'allows another recovery attempt after the guard interval', () => {
		const event = { preventDefault: vi.fn() };
		const storage = createStorage( '100000' );
		const reload = vi.fn();

		handlePreloadError( event, {
			now: 100_000 + PRELOAD_ERROR_RELOAD_GUARD_INTERVAL,
			reload,
			storage,
		} );

		expect( storage.setItem ).toHaveBeenCalledWith(
			'storybook-preload-error-reload-attempt',
			String( 100_000 + PRELOAD_ERROR_RELOAD_GUARD_INTERVAL )
		);
		expect( event.preventDefault ).toHaveBeenCalledTimes( 1 );
		expect( reload ).toHaveBeenCalledTimes( 1 );
	} );
} );
