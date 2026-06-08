/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';

type SyncConfig = typeof import('../config');

function loadConfigWithFilteredIntervals(
	filteredIntervals: Record< string, unknown >
): SyncConfig {
	jest.resetModules();
	jest.doMock( '@wordpress/hooks', () => ( {
		applyFilters: jest.fn( ( hookName: string, defaultValue: unknown ) => {
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

	return require( '../config' ) as SyncConfig;
}

describe( 'http-polling config', () => {
	it( 'uses default polling intervals when filters do not change them', () => {
		const config = loadConfigWithFilteredIntervals( {} );

		expect( config.POLLING_INTERVAL_IN_MS ).toBe( 4000 );
		expect( config.POLLING_INTERVAL_WITH_COLLABORATORS_IN_MS ).toBe( 1000 );
	} );

	it( 'allows filters to make active polling intervals faster', () => {
		const config = loadConfigWithFilteredIntervals( {
			'sync.pollingManager.pollingInterval': 1000,
			'sync.pollingManager.pollingIntervalWithCollaborators': 250,
		} );

		expect( config.POLLING_INTERVAL_IN_MS ).toBe( 1000 );
		expect( config.POLLING_INTERVAL_WITH_COLLABORATORS_IN_MS ).toBe( 250 );
	} );

	it( 'caps filters that would make active polling intervals slower', () => {
		const config = loadConfigWithFilteredIntervals( {
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
		( _label, filteredValue ) => {
			const config = loadConfigWithFilteredIntervals( {
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
