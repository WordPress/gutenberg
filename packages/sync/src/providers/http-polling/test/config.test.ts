import { describe, expect, it, vi } from 'vitest';

type SyncConfig = typeof import('../config');

function loadConfigWithFilteredIntervals(
	filteredIntervals: Record< string, unknown >
): Promise< SyncConfig > {
	vi.resetModules();
	vi.doMock( import( '@wordpress/hooks' ), async ( importOriginal ) => ( {
		...( await importOriginal() ),
		applyFilters: vi.fn( ( hookName: string, defaultValue: unknown ) => {
			if (
				Object.prototype.hasOwnProperty.call(
					filteredIntervals,
					hookName
				)
			) {
				return filteredIntervals[ hookName ];
			}

			return defaultValue;
		} ),
	} ) );

	return import( '../config' );
}

describe( 'http-polling config', () => {
	it( 'uses default polling intervals when filters do not change them', async () => {
		const config = await loadConfigWithFilteredIntervals( {} );

		expect( config.POLLING_INTERVAL_IN_MS ).toBe( 4000 );
		expect( config.POLLING_INTERVAL_WITH_COLLABORATORS_IN_MS ).toBe( 1000 );
	} );

	it( 'allows filters to make active polling intervals faster', async () => {
		const config = await loadConfigWithFilteredIntervals( {
			'sync.pollingManager.pollingInterval': 1000,
			'sync.pollingManager.pollingIntervalWithCollaborators': 250,
		} );

		expect( config.POLLING_INTERVAL_IN_MS ).toBe( 1000 );
		expect( config.POLLING_INTERVAL_WITH_COLLABORATORS_IN_MS ).toBe( 250 );
	} );

	it( 'caps filters that would make active polling intervals slower', async () => {
		const config = await loadConfigWithFilteredIntervals( {
			'sync.pollingManager.pollingInterval': 10000,
			'sync.pollingManager.pollingIntervalWithCollaborators': 2500,
		} );

		expect( config.POLLING_INTERVAL_IN_MS ).toBe( 4000 );
		expect( config.POLLING_INTERVAL_WITH_COLLABORATORS_IN_MS ).toBe( 1000 );
	} );

	it.each( [
		[ 'zero', 0 ],
		[ 'negative', -1 ],
		[ 'non-finite', Infinity ],
		[ 'non-number', '100' ],
	] )(
		'uses default intervals when filters return %s values',
		async ( _label, filteredValue ) => {
			const config = await loadConfigWithFilteredIntervals( {
				'sync.pollingManager.pollingInterval': filteredValue,
				'sync.pollingManager.pollingIntervalWithCollaborators':
					filteredValue,
			} );

			expect( config.POLLING_INTERVAL_IN_MS ).toBe( 4000 );
			expect( config.POLLING_INTERVAL_WITH_COLLABORATORS_IN_MS ).toBe(
				1000
			);
		}
	);
} );
