/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { createHttpPollingProvider } from './http-polling/http-polling-provider';
import {
	createHttpLongPollingProvider,
	HTTP_LONG_POLLING_TRANSPORT_SLUG,
} from './http-long-polling/http-long-polling-provider';
import { getAnnouncedSync, HTTP_POLLING_TRANSPORT_SLUG } from '../engines';
import type { ProviderCreator } from '../types';

/**
 * A client transport registration: a slug the server can announce, the
 * transport protocol version this client implements, and a factory for the
 * provider creator. Transports live in sibling folders under `providers/`
 * and register here by slug; the active one is chosen by NEGOTIATION against
 * the server announcement (which is driven by a single site config value).
 */
export interface TransportRegistration {
	slug: string;
	protocolVersion: number;
	create: () => ProviderCreator;
}

let providerCreators: ProviderCreator[] | null = null;

/**
 * The built-in client transports, in fallback preference order. Adding a
 * transport is a matter of dropping a sibling folder and appending its
 * registration here (or via the `sync.transports` filter) — the negotiation
 * below never changes.
 *
 * @return {TransportRegistration[]} Built-in transports.
 */
function getDefaultTransports(): TransportRegistration[] {
	return [
		{
			slug: HTTP_POLLING_TRANSPORT_SLUG,
			protocolVersion: 1,
			create: createHttpPollingProvider,
		},
		{
			slug: HTTP_LONG_POLLING_TRANSPORT_SLUG,
			protocolVersion: 1,
			create: createHttpLongPollingProvider,
		},
	];
}

/**
 * The registered client transports, filterable by plugins.
 *
 * @return {TransportRegistration[]} Registered transports.
 */
function getRegisteredTransports(): TransportRegistration[] {
	const registered: unknown = applyFilters(
		'sync.transports',
		getDefaultTransports()
	);
	if ( ! Array.isArray( registered ) ) {
		return getDefaultTransports();
	}
	return registered.filter(
		( t ): t is TransportRegistration =>
			!! t &&
			'object' === typeof t &&
			'string' === typeof ( t as TransportRegistration ).slug &&
			'function' === typeof ( t as TransportRegistration ).create
	);
}

/**
 * Negotiates the transport to use against the server announcement. The
 * announcement lists supported transports in the server's preference order
 * (active first); this client picks the FIRST announced slug it has
 * registered whose protocol it implements. Returns null when there is no
 * mutually-supported transport (the caller then declines to connect, so
 * regular post locking applies — the same posture as an engine mismatch).
 *
 * @return {ProviderCreator | null} The chosen provider creator, or null.
 */
function negotiateTransport(): ProviderCreator | null {
	const registered = getRegisteredTransports();
	const announced = getAnnouncedSync();

	// Pre-handshake server (no announcement): default to HTTP polling.
	if ( ! announced ) {
		const fallback =
			registered.find(
				( t ) => HTTP_POLLING_TRANSPORT_SLUG === t.slug
			) ?? registered[ 0 ];
		return fallback ? fallback.create() : null;
	}

	for ( const slug of announced.transports ) {
		const match = registered.find(
			( t ) =>
				t.slug === slug &&
				t.protocolVersion === announced.transportProtocol
		);
		if ( match ) {
			return match.create();
		}
	}
	return null;
}

/**
 * Type guard to ensure filter return values are functions.
 *
 * @param {unknown} creator
 * @return {boolean} Whether the argument is a function
 */
function isProviderCreator( creator: unknown ): creator is ProviderCreator {
	return 'function' === typeof creator;
}

/**
 * Returns the default provider creators: the negotiated transport, as a
 * single-element list (empty when no transport is mutually supported).
 *
 * @return {ProviderCreator[]} Creator functions for the chosen transport.
 */
export function getDefaultProviderCreators(): ProviderCreator[] {
	const creator = negotiateTransport();
	return creator ? [ creator ] : [];
}

/**
 * Get the current provider creators, allowing plugins to filter the array.
 *
 * @return {ProviderCreator[]} Creator functions for the active transport.
 */
export function getProviderCreators(): ProviderCreator[] {
	if ( providerCreators ) {
		return providerCreators;
	}

	// Check if real-time collaboration is enabled via WordPress setting.
	if ( ! window._wpCollaborationEnabled ) {
		return [];
	}

	/**
	 * Filter the available provider creators. The default is the negotiated
	 * transport; plugins (and tests) may replace the list outright.
	 */
	const filteredProviderCreators: unknown = applyFilters(
		'sync.providers',
		getDefaultProviderCreators()
	);

	// If the returned value is not an array, ignore and set to empty array.
	if ( ! Array.isArray( filteredProviderCreators ) ) {
		providerCreators = [];
		return providerCreators;
	}

	providerCreators = filteredProviderCreators.filter( isProviderCreator );

	return providerCreators;
}

/**
 * Resets the provider creator cache. Test use only.
 */
export function resetProviderCreatorsForTesting(): void {
	providerCreators = null;
}
