import { applyFilters } from '@wordpress/hooks';
import { createHttpPollingProvider } from './http-polling/http-polling-provider';
import type { ProviderCreator } from '../types';

let providerCreators: ProviderCreator[] | null = null;

/**
 * Returns the default provider creators. HTTP polling is the default when
 * real-time collaboration is enabled.
 *
 * @return {ProviderCreator[]} Creator functions for Yjs providers.
 */
export function getDefaultProviderCreators(): ProviderCreator[] {
	return window.__experimentalEnableRealTimeCollaboration
		? [ createHttpPollingProvider() ]
		: [];
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

	// Check if real-time collaboration is enabled.
	if ( ! window.__experimentalEnableRealTimeCollaboration ) {
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
