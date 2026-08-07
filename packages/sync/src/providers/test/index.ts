/**
 * External dependencies
 */
import { afterEach, describe, expect, it } from '@jest/globals';

/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	getDefaultProviderCreators,
	getProviderCreators,
	resetProviderCreatorsForTesting,
	type TransportRegistration,
} from '../index';
import type { ProviderCreator } from '../../types';

const FILTER_HOOK = 'test/providers';

describe( 'transport negotiation', () => {
	afterEach( () => {
		removeFilter( 'sync.transports', FILTER_HOOK );
		removeFilter( 'sync.providers', FILTER_HOOK );
		resetProviderCreatorsForTesting();
		delete window._wpCollaborationEnabled;
		delete window._wpCollaborationSync;
	} );

	const fakeTransport = (
		slug: string,
		protocolVersion = 1
	): TransportRegistration & { created: number } => {
		const reg = {
			slug,
			protocolVersion,
			created: 0,
			create: () => {
				reg.created++;
				return ( async () => ( {
					destroy: () => {},
					on: () => {},
				} ) ) as ProviderCreator;
			},
		};
		return reg;
	};

	it( 'picks the first announced transport it has registered', () => {
		const ws = fakeTransport( 'websocket' );
		const poll = fakeTransport( 'http-polling' );
		addFilter( 'sync.transports', FILTER_HOOK, () => [ ws, poll ] );

		// Server prefers websocket, offers polling as fallback.
		window._wpCollaborationSync = {
			engine: 'intent-log',
			engineProtocol: 1,
			transports: [ 'websocket', 'http-polling' ],
			transportProtocol: 1,
		};

		expect( getDefaultProviderCreators() ).toHaveLength( 1 );
		expect( ws.created ).toBe( 1 );
		expect( poll.created ).toBe( 0 );
	} );

	it( 'falls back to the next announced transport when the preferred is unregistered', () => {
		const poll = fakeTransport( 'http-polling' );
		// This client does NOT register websocket.
		addFilter( 'sync.transports', FILTER_HOOK, () => [ poll ] );

		window._wpCollaborationSync = {
			engine: 'intent-log',
			engineProtocol: 1,
			transports: [ 'websocket', 'http-polling' ],
			transportProtocol: 1,
		};

		expect( getDefaultProviderCreators() ).toHaveLength( 1 );
		expect( poll.created ).toBe( 1 );
	} );

	it( 'declines to connect when no announced transport is registered', () => {
		const poll = fakeTransport( 'http-polling' );
		addFilter( 'sync.transports', FILTER_HOOK, () => [ poll ] );

		window._wpCollaborationSync = {
			engine: 'intent-log',
			engineProtocol: 1,
			transports: [ 'websocket' ],
			transportProtocol: 1,
		};

		expect( getDefaultProviderCreators() ).toEqual( [] );
	} );

	it( 'rejects a transport whose protocol version differs from the announced one', () => {
		const poll = fakeTransport( 'http-polling', 1 );
		addFilter( 'sync.transports', FILTER_HOOK, () => [ poll ] );

		window._wpCollaborationSync = {
			engine: 'intent-log',
			engineProtocol: 1,
			transports: [ 'http-polling' ],
			transportProtocol: 2, // client only implements v1
		};

		expect( getDefaultProviderCreators() ).toEqual( [] );
	} );

	it( 'defaults to HTTP polling before the server announces', () => {
		const poll = fakeTransport( 'http-polling' );
		addFilter( 'sync.transports', FILTER_HOOK, () => [ poll ] );
		// No _wpCollaborationSync announcement.

		expect( getDefaultProviderCreators() ).toHaveLength( 1 );
		expect( poll.created ).toBe( 1 );
	} );

	it( 'getProviderCreators returns [] when collaboration is disabled', () => {
		expect( getProviderCreators() ).toEqual( [] );
	} );

	it( 'lets the sync.providers filter override the negotiated list', () => {
		window._wpCollaborationEnabled = '1';
		const creator = ( async () => ( {
			destroy: () => {},
			on: () => {},
		} ) ) as ProviderCreator;
		addFilter( 'sync.providers', FILTER_HOOK, () => [ creator ] );

		expect( getProviderCreators() ).toEqual( [ creator ] );
	} );
} );
