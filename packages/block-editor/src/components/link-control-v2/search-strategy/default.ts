/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	withMinLength,
	withDirectEntry,
	withFetch,
	withInitialSuggestions,
} from './mixins';
import type { HandleSearch } from './types';
import type { FetchSuggestionsFunction } from '../types';

/**
 * Options for creating the default search handler.
 */
export interface DefaultSearchHandlerOptions {
	/**
	 * Whether to show initial suggestions when no search query is provided.
	 * @default true
	 */
	showInitialSuggestions?: boolean;
}

/**
 * Creates the default search handler with sensible defaults.
 *
 * - Minimum entry length: 2 characters
 * - Handles direct entry URLs
 * - Fetches suggestions using the provided fetch function
 * - Shows initial suggestions by default (can be disabled)
 *
 * @param fetchSuggestions Optional function to fetch suggestions. If not provided, only direct entry is handled.
 * @param options          Optional configuration options.
 * @return The default search handler.
 */
export function createDefaultSearchHandler(
	fetchSuggestions?: FetchSuggestionsFunction,
	options: DefaultSearchHandlerOptions = {}
): HandleSearch {
	const { showInitialSuggestions = true } = options;

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
			withInitialSuggestions( showInitialSuggestions ),
			withMinLength( 2 ),
			withDirectEntry(),
			withFetch( fetchSuggestions )
		)( fallbackHandler );
	}

	// If no fetch function, only handle direct entry
	return (
		compose as < T >( ...fns: Array< ( arg: T ) => T > ) => ( arg: T ) => T
	 )(
		withInitialSuggestions( showInitialSuggestions ),
		withDirectEntry()
	)( fallbackHandler );
}
