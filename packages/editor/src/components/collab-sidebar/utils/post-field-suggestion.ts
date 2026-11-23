import {
	findPostAttributeOps,
	parseSuggestionPayload,
} from '../../suggestion-mode/operations';
import {
	getSuggestionStatus,
	isPendingStatus,
} from '../../suggestion-mode/suggestion-status';

interface NoteThread {
	status?: string;
	meta?: {
		_wp_suggestion?: string | null;
		_wp_suggestion_status?: string;
	};
}

/**
 * Whether a note is an undecided suggestion on a post field (the title, the
 * excerpt, a taxonomy...), which targets the post itself and not a block.
 *
 * @param thread Root note thread.
 * @return True for an open post field suggestion.
 */
export function isOpenPostFieldSuggestion( thread: NoteThread ): boolean {
	// A decided suggestion stays `hold` until the post is saved.
	if (
		thread.status !== 'hold' ||
		! isPendingStatus( getSuggestionStatus( thread ) )
	) {
		return false;
	}
	const payload = parseSuggestionPayload( thread.meta?._wp_suggestion );
	return findPostAttributeOps( payload?.operations ).length > 0;
}
