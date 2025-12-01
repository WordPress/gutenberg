/**
 * Internal dependencies
 */
import {
	detectDirectEntry,
	checkMinLength,
	createDirectEntrySuggestion,
	createFetchHandler,
} from './utilities';
import type { HandleSearch, SearchContext } from './types';
import type {
	FetchSuggestionsFunction,
	FetchSuggestionsOptions,
} from '../types';

/**
 * Higher-order function that wraps a search handler with minimum length checking.
 * Returns empty suggestions if search value is below minimum length.
 *
 * @param minLength Minimum required search length.
 * @return A function that wraps a HandleSearch with min length checking.
 */
export function withMinLength( minLength: number ) {
	return ( handler: HandleSearch ): HandleSearch => {
		return async ( searchValue: string, context: SearchContext ) => {
			if ( ! checkMinLength( searchValue, minLength ) ) {
				return { suggestions: [] };
			}
			return handler( searchValue, context );
		};
	};
}

/**
 * Higher-order function that wraps a search handler with direct entry detection.
 * If the search value looks like a URL, returns it as a direct entry suggestion.
 *
 * @return A function that wraps a HandleSearch with direct entry detection.
 */
export function withDirectEntry() {
	return ( handler: HandleSearch ): HandleSearch => {
		return async ( searchValue: string, context: SearchContext ) => {
			if ( detectDirectEntry( searchValue ) ) {
				return {
					suggestions: [ createDirectEntrySuggestion( searchValue ) ],
				};
			}
			return handler( searchValue, context );
		};
	};
}

/**
 * Higher-order function that wraps a search handler with fetch functionality.
 * Calls the fetch function with dynamically determined options.
 *
 * @param fetchFn The fetch suggestions function to call.
 * @param getOptions Optional function to determine fetch options based on search value and context.
 * @return A function that wraps a HandleSearch with fetch functionality.
 */
export function withFetch(
	fetchFn: FetchSuggestionsFunction,
	getOptions?: (
		searchValue: string,
		context: SearchContext
	) => FetchSuggestionsOptions
) {
	const fetchHandler = createFetchHandler( fetchFn, getOptions );
	return (): HandleSearch => {
		return async ( searchValue: string, context: SearchContext ) => {
			// Always use fetch result (even if empty) - don't fall through to handler
			return await fetchHandler( searchValue, context );
		};
	};
}
