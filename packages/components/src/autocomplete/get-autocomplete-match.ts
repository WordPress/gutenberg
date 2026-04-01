/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * Internal dependencies
 */
import { escapeRegExp } from '../utils/strings';
import type { WPCompleter } from './types';

export type AutocompleteMatch = {
	completer: WPCompleter;
	filterValue: string;
};

/**
 * Determines the best autocomplete match for the given text content.
 *
 * This is a pure function extracted from the useAutocomplete hook
 * to enable unit testing of the matching algorithm.
 *
 * @param textContent           The full text content up to the cursor.
 * @param completers            Available completers.
 * @param filteredOptionsLength Number of currently filtered options (0 = mismatch).
 * @param isBackspacing         Whether the user is currently backspacing.
 * @param textAfterSelection    Text content after the cursor.
 * @return The match result, or null if no match.
 */
export function getAutocompleteMatch(
	textContent: string,
	completers: WPCompleter[],
	filteredOptionsLength: number,
	isBackspacing: boolean,
	textAfterSelection: string
): AutocompleteMatch | null {
	if ( ! textContent ) {
		return null;
	}

	// Find the completer with the highest triggerPrefix index in the
	// textContent.
	const completer = completers.reduce< WPCompleter | null >(
		( lastTrigger, currentCompleter ) => {
			const triggerIndex = textContent.lastIndexOf(
				currentCompleter.triggerPrefix
			);
			const lastTriggerIndex =
				lastTrigger !== null
					? textContent.lastIndexOf( lastTrigger.triggerPrefix )
					: -1;

			return triggerIndex > lastTriggerIndex
				? currentCompleter
				: lastTrigger;
		},
		null
	);

	if ( ! completer ) {
		return null;
	}

	const { allowContext, triggerPrefix } = completer;
	const triggerIndex = textContent.lastIndexOf( triggerPrefix );
	const textWithoutTrigger = textContent.slice(
		triggerIndex + triggerPrefix.length
	);

	// This is a final barrier to prevent matching with an extremely long
	// string, which causes the editor to slow-down significantly.
	const tooDistantFromTrigger = textWithoutTrigger.length > 50;
	if ( tooDistantFromTrigger ) {
		return null;
	}

	const mismatch = filteredOptionsLength === 0;
	const wordsFromTrigger = textWithoutTrigger.split( /\s/ );

	// Allow matching when typing a trigger + the match string or when
	// clicking in an existing trigger word on the page.
	const hasOneTriggerWord = wordsFromTrigger.length === 1;

	// Allow matching when backspacing near a trigger word (up to 3 words).
	const matchingWhileBackspacing =
		isBackspacing && wordsFromTrigger.length <= 3;

	if ( mismatch && ! ( matchingWhileBackspacing || hasOneTriggerWord ) ) {
		return null;
	}

	if (
		allowContext &&
		! allowContext(
			textContent.slice( 0, triggerIndex ),
			textAfterSelection
		)
	) {
		return null;
	}

	if (
		/^\s/.test( textWithoutTrigger ) ||
		/\s\s+$/.test( textWithoutTrigger )
	) {
		return null;
	}

	if ( ! /[\u0000-\uFFFF]*$/.test( textWithoutTrigger ) ) {
		return null;
	}

	const safeTrigger = escapeRegExp( triggerPrefix );
	const text = removeAccents( textContent );
	const match = text
		.slice( text.lastIndexOf( triggerPrefix ) )
		.match( new RegExp( `${ safeTrigger }([\u0000-\uFFFF]*)$` ) );
	const query = match && match[ 1 ];

	return {
		completer,
		filterValue: query === null ? '' : query,
	};
}
