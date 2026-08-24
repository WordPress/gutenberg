import { applyFilters } from '@wordpress/hooks';
import { getAnnouncedSync } from '../engines';
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
 * Transports registered imperatively through the private API
 * `registerSyncTransport` (used by the engines plugin), merged with the
 * built-ins and any `sync.transports` filter additions during negotiation.
 */
const registeredTransports: TransportRegistration[] = [];

/**
 * Registers a client transport (private API). Invalidates the negotiated
 * provider cache so the next resolution can pick it.
 *
 * @param {TransportRegistration} transport Transport registration.
 */
export function registerSyncTransport(
	transport: TransportRegistration
): void {
	if (
		transport &&
		'string' === typeof transport.slug &&
		'function' === typeof transport.create
	) {
		registeredTransports.push( transport );
		providerCreators = null;
	}
}

/**
 * The framework ships NO built-in transports. Transports live in an engines/
 * transports plugin (the Gutenberg Sync Engines plugin), which registers them
 * via `registerSyncTransport` (or the `sync.transports` filter). Without such a
 * plugin the list is empty and no connection is negotiated.
 *
 * @return {TransportRegistration[]} Built-in transports (none).
 */
function getDefaultTransports(): TransportRegistration[] {
	return [];
}

/**
 * The registered client transports, filterable by plugins.
 *
 * @return {TransportRegistration[]} Registered transports.
 */
function getRegisteredTransports(): TransportRegistration[] {
	const registered: unknown = applyFilters( 'sync.transports', [
		...getDefaultTransports(),
		...registeredTransports,
	] );
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
	const announced = getAnnouncedSync();

	// No announcement: nothing to negotiate. The handshake is required, and the
	// framework ships no default transport to fall back to.
	if ( ! announced ) {
		return null;
	}

	const registered = getRegisteredTransports();
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

	// Check if real-time collaboration is enabled.
	if ( ! window.__experimentalEnableRealTimeCollaboration ) {
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
	registeredTransports.length = 0;
}
