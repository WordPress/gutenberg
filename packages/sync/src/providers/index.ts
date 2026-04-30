/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { createHttpPollingProvider } from './http-polling/http-polling-provider';
import type { ProviderCreator } from '../types';

let providerCreators: ProviderCreator[] | null = null;

/**
 * Returns provider creators for IndexedDB and WebRTC with HTTP signaling. These
 * are the current default providers.
 *
 * @return {ProviderCreator[]} Creator functions for Yjs providers.
 */
export function getDefaultProviderCreators(): ProviderCreator[] {
	const signalingUrl = window?.wp?.ajax?.settings?.url;
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
