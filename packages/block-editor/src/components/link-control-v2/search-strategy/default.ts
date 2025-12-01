/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { select } from '@wordpress/data';

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
import { store as blockEditorStore } from '../../../store';

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
 * - Fetches suggestions using the provided fetch function, or falls back to
 *   `__experimentalFetchLinkSuggestions` from block editor settings
 * - Shows initial suggestions by default (can be disabled)
 *
 * @param fetchSuggestions Optional function to fetch suggestions. If not provided,
 *                         falls back to `__experimentalFetchLinkSuggestions` from block editor settings.
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

	// Determine which fetch function to use
	// 1. Use provided fetchSuggestions if given
	// 2. Fall back to settings.__experimentalFetchLinkSuggestions (like original LinkControl)
	const fetchFn =
		fetchSuggestions ||
		select( blockEditorStore ).getSettings()
			.__experimentalFetchLinkSuggestions;

	// Compose mixins to build the default handler
	if ( fetchFn ) {
		return (
			compose as < T >(
				...fns: Array< ( arg: T ) => T >
			) => ( arg: T ) => T
		 )(
			withInitialSuggestions( showInitialSuggestions ),
			withMinLength( 2 ),
			withDirectEntry(),
			withFetch( fetchFn )
		)( fallbackHandler );
	}

	// If no fetch function available, only handle direct entry
	return (
		compose as < T >( ...fns: Array< ( arg: T ) => T > ) => ( arg: T ) => T
	 )(
		withInitialSuggestions( showInitialSuggestions ),
		withDirectEntry()
	)( fallbackHandler );
}
