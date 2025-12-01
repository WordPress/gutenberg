/**
 * WordPress dependencies
 */
import { prependHTTP } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { isURLLike } from '../utils/is-url-like';
import type { LinkSuggestion } from '../types';

/**
 * Detects if a string looks like a URL (direct entry).
 *
 * @param value The string to check.
 * @return Whether the string looks like a URL.
 */
export function detectDirectEntry( value: string ): boolean {
	return isURLLike( value );
}

/**
 * Checks if a search value meets the minimum length requirement.
 *
 * @param value     The search value to check.
 * @param minLength Minimum required length.
 * @return Whether the value meets the minimum length.
 */
export function checkMinLength( value: string, minLength: number ): boolean {
	return value.length >= minLength;
}

/**
 * Creates a direct entry suggestion from a URL string.
 *
 * @param url The URL string.
 * @return A LinkSuggestion marked as direct entry.
 */
export function createDirectEntrySuggestion( url: string ): LinkSuggestion {
	const normalizedUrl = prependHTTP( url );
	return {
		title: normalizedUrl,
		url: normalizedUrl,
		type: 'URL',
		isDirectEntry: true,
	};
}

/**
 * Creates a fetch handler that calls a FetchSuggestionsFunction with options.
 *
 * @param fetchFn    The fetch suggestions function to call.
 * @param getOptions Optional function to determine fetch options based on search value and context.
 * @return A HandleSearch function that fetches suggestions.
 */
export function createFetchHandler(
	fetchFn: FetchSuggestionsFunction,
	getOptions?: (
		searchValue: string,
		context: import('./types').SearchContext
	) => FetchSuggestionsOptions
): import('./types').HandleSearch {
	return async ( searchValue, context ) => {
		const options = getOptions
			? getOptions( searchValue, context )
			: {
					isInitialSuggestions: context.isInitial,
					currentValue: context.currentValue,
			  };

		const suggestions = await fetchFn( searchValue, options );
		return { suggestions };
	};
}
