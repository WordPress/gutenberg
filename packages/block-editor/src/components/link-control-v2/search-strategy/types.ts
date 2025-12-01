/**
 * Internal dependencies
 */
import type { LinkValue, LinkSuggestion } from '../types';

/**
 * Context passed to search handlers.
 */
export interface SearchContext {
	/**
	 * Current committed link value (if any).
	 */
	currentValue?: LinkValue;
	/**
	 * Whether this is a request for initial suggestions (when no search query).
	 */
	isInitial?: boolean;
	/**
	 * Any additional context consumers want to pass.
	 */
	[ key: string ]: any;
}

/**
 * Result returned from a search handler.
 */
export interface SearchResult {
	/**
	 * Array of link suggestions.
	 * Direct entries should be included as suggestions with `isDirectEntry: true`.
	 */
	suggestions: LinkSuggestion[];
}

/**
 * Function that handles search requests.
 * This is the core imperative function that determines what happens when a search is made.
 *
 * @param searchValue The search query string (empty string for initial suggestions).
 * @param context     Search context (current value, isInitial, etc.).
 * @return Promise resolving to search results.
 */
export type HandleSearch = (
	searchValue: string,
	context: SearchContext
) => Promise< SearchResult >;
