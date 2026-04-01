/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * Internal dependencies
 */
import type { WPCompleter } from './types';

type AutocompleteMatch = {
	completer: WPCompleter;
	filterValue: string;
};

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
	// textContent. Compute lastIndexOf once per completer to avoid
	// redundant lookups in the reduce accumulator.
	let completer: WPCompleter | null = null;
	let triggerIndex = -1;

	for ( const currentCompleter of completers ) {
		const currentIndex = textContent.lastIndexOf(
			currentCompleter.triggerPrefix
		);
		if ( currentIndex > triggerIndex ) {
			completer = currentCompleter;
			triggerIndex = currentIndex;
		}
	}

	if ( ! completer ) {
		return null;
	}

	const { allowContext, triggerPrefix } = completer;
	const textWithoutTrigger = textContent.slice(
		triggerIndex + triggerPrefix.length
	);

	// Prevent matching with an extremely long string, which causes
	// the editor to slow-down significantly.
	if ( textWithoutTrigger.length > 50 ) {
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

	return {
		completer,
		filterValue: removeAccents( textWithoutTrigger ),
	};
}
