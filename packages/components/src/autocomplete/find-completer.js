/**
 * External dependencies
 */
import { find } from 'lodash';

export default function findCompleter( {
	text,
	textAfterSelection,
	completers,
	filteredOptions,
	backspacing,
} ) {
	const completer = find( completers, ( { triggerPrefix, allowContext } ) => {
		const index = text.lastIndexOf( triggerPrefix );

		if ( index === -1 ) {
			return false;
		}

		const textWithoutTrigger = text.slice( index + triggerPrefix.length );

		const tooDistantFromTrigger = textWithoutTrigger.length > 50; // 50 chars seems to be a good limit.
		// This is a final barrier to prevent the effect from completing with
		// an extremely long string, which causes the editor to slow-down
		// significantly. This could happen, for example, if `matchingWhileBackspacing`
		// is true and one of the "words" end up being too long. If that's the case,
		// it will be caught by this guard.
		if ( tooDistantFromTrigger ) return false;

		const mismatch = filteredOptions.length === 0;
		const wordsFromTrigger = textWithoutTrigger.split( /\s/ );
		// We need to allow the effect to run when not backspacing and if there
		// was a mismatch. i.e when typing a trigger + the match string or when
		// clicking in an existing trigger word on the page. We do that if we
		// detect that we have one word from trigger in the current textual context.
		//
		// Ex.: "Some text @a" <-- "@a" will be detected as the trigger word and
		// allow the effect to run. It will run until there's a mismatch.
		const hasOneTriggerWord = wordsFromTrigger.length === 1;
		// This is used to allow the effect to run when backspacing and if
		// "touching" a word that "belongs" to a trigger. We consider a "trigger
		// word" any word up to the limit of 3 from the trigger character.
		// Anything beyond that is ignored if there's a mismatch. This allows
		// us to "escape" a mismatch when backspacing, but still imposing some
		// sane limits.
		//
		// Ex: "Some text @marcelo sekkkk" <--- "kkkk" caused a mismatch, but
		// if the user presses backspace here, it will show the completion popup again.
		const matchingWhileBackspacing =
			backspacing && textWithoutTrigger.split( /\s/ ).length <= 3;

		if ( mismatch && ! ( matchingWhileBackspacing || hasOneTriggerWord ) ) {
			return false;
		}

		if (
			allowContext &&
			! allowContext( text.slice( 0, index ), textAfterSelection )
		) {
			return false;
		}

		if (
			/^\s/.test( textWithoutTrigger ) ||
			/\s\s+$/.test( textWithoutTrigger )
		) {
			return false;
		}

		return /[\u0000-\uFFFF]*$/.test( textWithoutTrigger );
	} );
	return completer;
}
