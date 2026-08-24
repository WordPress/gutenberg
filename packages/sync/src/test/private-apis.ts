/**
 * External dependencies
 */
import { afterEach, describe, expect, it } from '@jest/globals';

/**
 * WordPress dependencies
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

/**
 * Internal dependencies
 */
import { privateApis } from '../private-apis';
import { getEngineAdapters, resetEngineAdaptersForTesting } from '../engines';
import {
	getDefaultProviderCreators,
	resetProviderCreatorsForTesting,
} from '../providers';
import type { ProviderCreator } from '../types';

// A plugin unlocks the surface by claiming the '@wordpress/sync' module name
// (allowlisted, no double-registration guard) — the pattern the engines
// plugin uses.
const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/sync'
);

describe( 'sync private APIs (plugin registration surface)', () => {
	afterEach( () => {
		resetEngineAdaptersForTesting();
		resetProviderCreatorsForTesting();
		delete window._wpCollaborationSync;
		delete window.__experimentalEnableRealTimeCollaboration;
	} );

	it( 'exposes registerSyncEngine / registerSyncTransport through the unlocked surface', () => {
		const api = unlock( privateApis );
		expect( typeof api.registerSyncEngine ).toBe( 'function' );
		expect( typeof api.registerSyncTransport ).toBe( 'function' );
	} );

	it( 'a plugin-registered engine adapter resolves like a built-in', () => {
		const { registerSyncEngine } = unlock( privateApis );
		registerSyncEngine( {
			slug: 'plugin-engine',
			protocolVersion: 2,
			createManager: () => ( {} ) as never,
		} );

		const adapters = getEngineAdapters();
		expect( adapters[ 'plugin-engine' ] ).toBeDefined();
		expect( adapters[ 'plugin-engine' ].protocolVersion ).toBe( 2 );
		// The framework ships no built-in engines; only the plugin's registered
		// adapter is present.
		expect( Object.keys( adapters ) ).toEqual( [ 'plugin-engine' ] );
	} );

	it( 'a plugin-registered transport is negotiable', () => {
		const { registerSyncTransport } = unlock( privateApis );
		let created = 0;
		registerSyncTransport( {
			slug: 'plugin-transport',
			protocolVersion: 1,
			create: () => {
				created++;
				return ( async () => ( {
					destroy: () => {},
					on: () => {},
				} ) ) as ProviderCreator;
			},
		} );

		window._wpCollaborationSync = {
			engine: 'intent-log',
			engineProtocol: 1,
			transports: [ 'plugin-transport' ],
			transportProtocol: 1,
		};

		expect( getDefaultProviderCreators() ).toHaveLength( 1 );
		expect( created ).toBe( 1 );
	} );
} );
