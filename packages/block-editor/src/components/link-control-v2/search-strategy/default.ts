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
 * Creates the default search handler with sensible defaults.
 *
 * - Minimum entry length: 2 characters
 * - Handles direct entry URLs
 * - Fetches suggestions using the provided fetch function
 *
 * @param fetchSuggestions Optional function to fetch suggestions. If not provided, only direct entry is handled.
 * @return The default search handler.
 */
export function createDefaultSearchHandler(
	fetchSuggestions?: FetchSuggestionsFunction
): HandleSearch {
	// Fallback handler that returns empty suggestions
	const fallbackHandler: HandleSearch = async () => {
		return { suggestions: [] };
	};

	// Compose mixins to build the default handler
	if ( fetchSuggestions ) {
		return (
			compose as < T >(
				...fns: Array< ( arg: T ) => T >
			) => ( arg: T ) => T
		 )(
			withMinLength( 2 ),
			withDirectEntry(),
			withFetch( fetchSuggestions )
		)( fallbackHandler );
	}

	// If no fetch function, only handle direct entry
	return (
		compose as < T >( ...fns: Array< ( arg: T ) => T > ) => ( arg: T ) => T
	 )( withDirectEntry() )( fallbackHandler );
}
