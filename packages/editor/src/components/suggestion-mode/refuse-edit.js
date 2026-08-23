/**
 * The one place Suggest mode declines an edit outright.
 *
 * Suggest mode has two representations for a pending change: inline
 * `core/suggestion` markers in the block's content, and the whole-attribute
 * overlay that auto-save turns into an `attribute-set` operation. They are
 * mutually exclusive on a given attribute — the overlay renders a clean value
 * in place of the live one, so an overlay over a marked `content` value hides
 * every marker in that block and leaves the marker's note describing text the
 * reviewer can no longer see.
 *
 * Some edits can be expressed as neither: a delete straddling someone's pending
 * marker, a type-over of a marked run, a second format toggle over a marked
 * run. Those used to fall through to the overlay, which is exactly the case
 * that breaks the invariant. They are now declined at the seam that saw them,
 * and the user is told why.
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
 * @param {Object} registry Data registry.
 */
export function notifyEditRefused( registry ) {
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
