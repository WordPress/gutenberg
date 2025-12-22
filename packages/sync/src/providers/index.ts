/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { createHttpPollingProvider } from './http-polling-provider';
import { createWebRTCProvider } from './webrtc-provider';
import type { ProviderCreator } from '../types';

let providerCreators: ProviderCreator[] | null = null;

/**
 * Returns the defeault provider creators. Long-polling (SSE) is the current
 * default provider.
 *
 * @return {ProviderCreator[]} Creator functions for Yjs providers.
 */
function getDefaultProviderCreators(): ProviderCreator[] {
	const password = window?.__experimentalCollaborativeEditingSecret;
	const signalingUrl = window?.__experimentalCollaborativeEditingApiUrl;

	if ( ! password || ! signalingUrl ) {
		console.warn(
			'Provider not created because signaling URL or password is missing.'
		);
		return [];
	}

	return [
		createHttpPollingProvider( {
			endpoint: signalingUrl,
			secret: password,
		} ),
		createWebRTCProvider( {
			password,
			signalingUrl,
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

/**
 * Export provider creators for direct use
 */
export { createWebRTCProvider, createHttpPollingProvider };
