/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { createIndexedDbProvider } from './indexeddb-provider';
import { createWebRTCProvider } from './webrtc-provider';
import type { ProviderCreator } from '../types';

let providerCreators: ProviderCreator[] | null = null;

/**
 * Returns provider creators for IndexedDB and WebRTC with HTTP signaling. These
 * are the current default providers.
 *
 * @return {ProviderCreator[]} Creator functions for Yjs providers.
 */
function getDefaultProviderCreators(): ProviderCreator[] {
	const signalingUrl = window?.wp?.ajax?.settings?.url;

	if ( ! signalingUrl ) {
		return [];
	}

	return [
		createIndexedDbProvider,
		createWebRTCProvider( {
			password: window?.__experimentalCollaborativeEditingSecret,
			signaling: [ signalingUrl ],
		} ),
	];
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

	/**
	 * Filter the
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
