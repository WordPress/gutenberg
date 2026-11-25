/**
 * Single source of truth for whether Suggest mode is available.
 *
 * Gating happens at two altitudes, and both live here so the checks can't
 * drift apart across the intent menu, the keyboard shortcuts, and the
 * provider wiring:
 *
 *   - `isSuggestionModeEnabled()` — the Suggestion Mode experiment flag.
 *     PHP sets `window.__experimentalSuggestionMode` before any editor
 *     script evaluates, so this is safe to call at module scope (e.g. to
 *     decide whether to register block filters at all).
 *   - `useCanSuggest()` — the runtime predicate: the experiment flag AND
 *     the current post type's `editor.notes` support. Suggestions persist
 *     as note comments, so a post type without notes support can't hold
 *     them. Use this for anything that switches the editor into (or out
 *     of) an intent at runtime.
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { STORE_NAME } from '../../store/constants';
import { checkSupport } from '../post-type-support-check/check-support';

declare global {
	interface Window {
		__experimentalSuggestionMode?: boolean;
	}
}

/**
 * Whether the Suggestion Mode experiment is enabled.
 *
 * @return True when the experiment flag is set.
 */
export function isSuggestionModeEnabled(): boolean {
	return !! window?.__experimentalSuggestionMode;
}

/**
 * Whether the current post type declares the `editor.notes` support. Uses
 * the same `checkSupport` helper as `PostTypeSupportCheck` (which gates the
 * intent menu with `supportKeys="editor.notes"`), so the shortcut and menu
 * gates can't diverge.
 *
 * @param select Registry select function.
 * @return True when notes are supported.
 */
export function hasNotesSupport(
	select: ( store: string | typeof coreStore ) => any
): boolean {
	const editor = select( STORE_NAME );
	const postTypeSlug = editor?.getEditedPostAttribute?.( 'type' );
	const postType = postTypeSlug
		? select( coreStore ).getPostType( postTypeSlug )
		: null;
	if ( ! postType ) {
		return false;
	}
	return checkSupport( postType.supports, 'editor.notes' );
}

/**
 * Whether the editor may hold the Suggest intent, for code outside React.
 *
 * Refuses without the experiment, and on a post type known to lack notes
 * support, such as a template opened from a post. A post type that has not
 * resolved yet is not refused: the menu and the shortcuts are only offered
 * once it has, through `useCanSuggest()`.
 *
 * @param select Registry select function.
 * @return False when the Suggest intent must be refused.
 */
export function isSuggestIntentAvailable(
	select: ( store: string | typeof coreStore ) => any
): boolean {
	if ( ! isSuggestionModeEnabled() ) {
		return false;
	}
	const postTypeSlug = select( STORE_NAME ).getCurrentPostType();
	const postType = postTypeSlug
		? select( coreStore ).getPostType( postTypeSlug )
		: null;
	return ! postType || checkSupport( postType.supports, 'editor.notes' );
}

/**
 * Runtime predicate for entering the Suggest intent: the experiment must be
 * enabled AND the current post type must support notes.
 *
 * @return True when the current editor can host suggestions.
 */
export function useCanSuggest(): boolean {
	return useSelect(
		( select ) => isSuggestionModeEnabled() && hasNotesSupport( select ),
		[]
	);
}
