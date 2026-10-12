/**
 * The suggestions provider: one hook the auto-save loop, the inline
 * keyboards and the notes sidebar call for everything that touches a
 * suggestion's note. It composes the suggester's submission callbacks with
 * the reviewer's decision callbacks; persistence sits behind
 * `suggestion-store.ts` and the pure logic in `operations/`.
 */
import { useSuggestionDecisions } from './use-suggestion-decisions';
import { useSuggestionSubmission } from './use-suggestion-submission';

/**
 * Comment-meta backed suggestions provider. The provider shape is stable so
 * a future Yjs-backed provider can swap in without touching the UI.
 *
 * Storage: a `note` comment with the suggestion payload serialized to
 * the `_wp_suggestion` comment meta. Linkage to a block reuses the existing
 * `metadata.noteId` block attribute.
 *
 * @return Suggestions API.
 */
export function useSuggestionsProvider() {
	const { createSuggestion, updateSuggestion, deleteSuggestion } =
		useSuggestionSubmission();
	const { applySuggestion, rejectSuggestion } = useSuggestionDecisions();

	return {
		createSuggestion,
		updateSuggestion,
		deleteSuggestion,
		applySuggestion,
		rejectSuggestion,
	};
}
