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
 * Some edits can be expressed as neither. Markers of different kinds may
 * share text (a deletion inside someone's addition), but two markers of one
 * kind may not, so typing inside someone's addition, deleting over someone's
 * deletion or formatting over someone's formatting change is declined at the
 * seam that saw it (see `classifyOverlap`). The user is told whose suggestion
 * is in the way and can reply to it instead.
 */
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';
import type { EditRefusal } from '../inline-suggestions';
import { ALL_NOTES_SIDEBAR } from '../collab-sidebar/constants';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Fixed notice id so repeating a declined gesture (holding Backspace against a
 * marker) replaces the snackbar instead of stacking a new one per keystroke.
 */
export const REFUSED_EDIT_NOTICE_ID = 'editor/suggestion-mode/edit-refused';

/**
 * The refusal message for a marker in the way, naming its author when known.
 *
 * @param reason Why the edit was refused.
 * @param name   Display name of the blocking suggestion's author.
 * @return The message, or null to use the generic one.
 */
function refusalMessage(
	reason: EditRefusal[ 'reason' ],
	name: string | undefined
): string | null {
	switch ( reason ) {
		case 'add-in-add':
			return name
				? sprintf(
						/* translators: %s: name of the person who suggested the addition. */
						__(
							'%s suggested adding this text. Reply to their suggestion to propose a change.'
						),
						name
					)
				: __(
						'Someone suggested adding this text. Reply to their suggestion to propose a change.'
					);
		case 'insert-in-del':
			return name
				? sprintf(
						/* translators: %s: name of the person who suggested the deletion. */
						__(
							'%s suggested deleting this text. Reply to their suggestion to propose a change.'
						),
						name
					)
				: __(
						'Someone suggested deleting this text. Reply to their suggestion to propose a change.'
					);
		case 'del-over-del':
			return name
				? sprintf(
						/* translators: %s: name of the person who suggested the deletion. */
						__( '%s already suggested deleting this text.' ),
						name
					)
				: __( 'Someone already suggested deleting this text.' );
		case 'format-on-format':
			return name
				? sprintf(
						/* translators: %s: name of the person who suggested the formatting change. */
						__( '%s already suggested formatting this text.' ),
						name
					)
				: __( 'Someone already suggested formatting this text.' );
		case 'format-straddles-add':
			return name
				? sprintf(
						/* translators: %s: name of the person who suggested the addition. */
						__(
							'This formatting crosses a suggested addition by %s. Format the added text and the text around it separately.'
						),
						name
					)
				: __(
						'This formatting crosses a suggested addition. Format the added text and the text around it separately.'
					);
		default:
			return null;
	}
}

/**
 * Open the notes sidebar on a suggestion's thread and focus it, so the user
 * can reply to the suggestion their edit ran into.
 *
 * @param registry Data registry.
 * @param noteId   Note id of the suggestion.
 */
export function openSuggestionThread( registry: any, noteId: number ) {
	registry
		?.dispatch?.( interfaceStore )
		?.enableComplementaryArea?.( 'core', ALL_NOTES_SIDEBAR );
	const editor = registry?.dispatch?.( editorStore );
	if ( editor ) {
		unlock( editor ).selectNote?.( noteId, { focus: true } );
	}
}

/**
 * Tell the user their edit was declined because it overlaps a pending
 * suggestion, and what to do about it.
 *
 * With a refusal naming the marker in the way, the message says whose
 * suggestion it is and what they suggested, and offers to reply to it. The
 * author's own markers and edits with no single marker in the way (a
 * proposal that would hide a marker) keep the generic message.
 *
 * Takes a registry rather than a bound `createNotice` so the per-block overlay
 * HOC can call it without adding a `useDispatch` to every block's render; the
 * dispatch is resolved at call time. Silently does nothing when the notices
 * store isn't registered (isolated unit tests).
 *
 * @param registry  Data registry.
 * @param [refusal] Why the edit was refused, and the marker in the way.
 */
export function notifyEditRefused( registry: any, refusal?: EditRefusal ) {
	const blocking = refusal?.blocking;
	const note = blocking
		? registry
				?.select?.( coreStore )
				?.getEntityRecord?.( 'root', 'comment', Number( blocking.id ) )
		: undefined;
	const message =
		blocking && refusal
			? refusalMessage( refusal.reason, note?.author_name || undefined )
			: null;
	registry
		?.dispatch?.( noticesStore )
		?.createNotice?.(
			'warning',
			message ??
				__(
					'This change overlaps a pending suggestion, so it was not captured. Accept or reject that suggestion first.'
				),
			{
				id: REFUSED_EDIT_NOTICE_ID,
				type: 'snackbar',
				isDismissible: true,
				...( message &&
					blocking && {
						// An action needs time to be read and used.
						explicitDismiss: true,
						actions: [
							{
								label: __( 'Reply to this suggestion' ),
								onClick: () =>
									openSuggestionThread(
										registry,
										Number( blocking.id )
									),
							},
						],
					} ),
			}
		);
}
