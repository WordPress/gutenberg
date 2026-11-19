/**
 * The one place Suggestion mode declines an edit outright.
 *
 * Suggestion mode has two representations for a pending change: inline
 * suggestion markers in the block's content, and the whole-attribute
 * overlay that auto-save turns into an `attribute-set` operation. They are
 * mutually exclusive on a given attribute — the overlay renders a clean value
 * in place of the live one, so an overlay over a marked `content` value hides
 * every marker in that block and leaves the marker's note describing text the
 * reviewer can no longer see.
 *
 * Markers stack, so typing, deleting or formatting inside or across someone's
 * suggestion nests in it or stacks on it (see `classifyOverlap`). What is
 * left can be expressed as neither: splitting a block inside someone's
 * suggestion, and an edit that would hide a marker under a whole-attribute
 * proposal.
 */
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Fixed notice id so repeating a declined gesture (holding Backspace against a
 * marker) replaces the snackbar instead of stacking a new one per keystroke.
 */
export const REFUSED_EDIT_NOTICE_ID = 'editor/suggestion-mode/edit-refused';

/**
 * Tell the user their edit was declined because it overlaps a pending
 * suggestion, and what to do about it.
 *
 * Takes a registry rather than a bound `createNotice` so the per-block overlay
 * HOC can call it without adding a `useDispatch` to every block's render; the
 * dispatch is resolved at call time. Silently does nothing when the notices
 * store isn't registered (isolated unit tests).
 *
 * @param registry Data registry.
 */
export function notifyEditRefused( registry: any ) {
	registry
		?.dispatch?.( noticesStore )
		?.createNotice?.(
			'warning',
			__(
				'This change overlaps a pending suggestion, so it was not captured. Accept or reject that suggestion first.'
			),
			{
				id: REFUSED_EDIT_NOTICE_ID,
				type: 'snackbar',
				isDismissible: true,
			}
		);
}
