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
 * Returns the default provider creators. HTTP polling is available when its
 * Gutenberg experiment is enabled.
 *
 * @return {ProviderCreator[]} Creator functions for Yjs providers.
 */
export function getDefaultProviderCreators(): ProviderCreator[] {
	return window.experimentalPollingProvider
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

/**
 * Returns whether at least one sync provider creator is available.
 *
 * @return Whether a provider creator is available.
 */
export function hasProviderCreators(): boolean {
	return getProviderCreators().length > 0;
}
