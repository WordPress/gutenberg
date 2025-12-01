/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { withMinLength, withDirectEntry, withFetch } from './mixins';
import type { HandleSearch } from './types';
import type { FetchSuggestionsFunction } from '../types';

/**
 * Configuration for typed search handler.
 */
export interface TypedSearchHandlerConfig {
	/**
	 * Post type to search for (e.g., 'product', 'page', 'post').
	 */
	type: string;
	/**
	 * Optional subtype (e.g., 'page' for hierarchical post types).
	 */
	subtype?: string;
	/**
	 * Minimum search length before fetching (default: 2).
	 */
	minSearchLength?: number;
}

/**
 * Creates a search handler for a specific post type.
 * Useful for Nav block variations (e.g., "Product link" searches only products).
 *
 * @param fetchSuggestions Function to fetch suggestions from the API.
 * @param config            Configuration for the typed search handler.
 * @return                  A search handler configured for the specified type.
 *
 * @example
 * ```tsx
 * // Nav block "Product link" variation
 * const searchHandler = createTypedSearchHandler(fetchSuggestions, {
 *   type: 'product'
 * });
 *
 * <LinkControlV2 searchHandler={searchHandler} />
 * ```
 */
export function createTypedSearchHandler(
	fetchSuggestions: FetchSuggestionsFunction,
	config: TypedSearchHandlerConfig
): HandleSearch {
	const { type, subtype, minSearchLength = 2 } = config;

	// Fallback handler that returns empty suggestions
	const fallbackHandler: HandleSearch = async () => {
		return { suggestions: [] };
	};

	// Compose mixins to build the typed handler
	return (
		compose as < T >( ...fns: Array< ( arg: T ) => T > ) => ( arg: T ) => T
	 )(
		withMinLength( minSearchLength ),
		withDirectEntry(),
		withFetch( fetchSuggestions, ( searchValue, context ) => ( {
			type,
			subtype,
			isInitialSuggestions: context.isInitial,
			currentValue: context.currentValue,
		} ) )
	)( fallbackHandler );
}
