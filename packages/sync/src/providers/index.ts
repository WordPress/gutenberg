/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import type { ProviderCreator } from '../types';

let providerCreators: ProviderCreator[] | null = null;

/**
 * Returns Yjs provider creators for collaborative editing. There are currently
 * no default providers, so this function returns an empty array.
 *
 * @return {ProviderCreator[]} Creator functions for Yjs providers.
 */
function getDefaultProviderCreators(): ProviderCreator[] {
	return [];
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
