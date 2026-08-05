/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { createHttpPollingProvider } from './http-polling/http-polling-provider';
import { getAnnouncedSync, HTTP_POLLING_TRANSPORT_SLUG } from '../engines';
import type { ProviderCreator } from '../types';

let providerCreators: ProviderCreator[] | null = null;

/**
 * Returns the defeault provider creators. HTTP polling is the current default
 * provider.
 *
 * @return {ProviderCreator[]} Creator functions for Yjs providers.
 */
export function getDefaultProviderCreators(): ProviderCreator[] {
	return [ createHttpPollingProvider() ];
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
 * Get the current Yjs provider creators, allowing plugins to filter the array.
 *
 * @return {ProviderCreator[]} Creator functions for Yjs providers.
 */
export function getProviderCreators(): ProviderCreator[] {
	if ( providerCreators ) {
		return providerCreators;
	}

	// Check if real-time collaboration is enabled via WordPress setting.
	if ( ! window._wpCollaborationEnabled ) {
		return [];
	}

	/*
	 * Transport handshake: when the server announces its supported
	 * transports and HTTP polling is not among them, this client has no
	 * mutually supported transport — do not connect at all (the same
	 * degraded posture as collaboration disabled: regular post locking
	 * applies).
	 */
	const announced = getAnnouncedSync();
	if (
		announced &&
		! announced.transports.includes( HTTP_POLLING_TRANSPORT_SLUG )
	) {
		return [];
	}

	/**
	 * Filter the available provider creators.
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
