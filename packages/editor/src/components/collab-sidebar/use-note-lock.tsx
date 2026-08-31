import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '../../store';

/**
 * The note actions a lock can apply to. Mirrors the PHP enum in
 * `lib/compat/wordpress-7.2/notes-locking.php`; reopening a note is classified
 * as `resolve`.
 */
export const NOTE_LOCK_ACTIONS = [
	'create',
	'reply',
	'edit',
	'resolve',
	'delete',
] as const;

export type NoteAction = ( typeof NOTE_LOCK_ACTIONS )[ number ];

/**
 * Reads which note actions are locked for the post being edited.
 *
 * Two sources feed the result. `lockedNoteActions` is the per-action snapshot
 * the server computes at editor load, covering site-wide and custom filter
 * logic. The `_wp_notes_locked` post meta is read live off the post entity, so
 * a lock applied mid-session takes effect on the next post refresh instead of
 * waiting for a reload.
 *
 * The result gates affordances only. Every mutation is enforced server-side, so
 * a stale snapshot costs a rejected request and an error notice, not a bypass.
 *
 * @return The locked actions, and whether every action is locked.
 */
export function useNoteLock(): {
	lockedActions: ReadonlySet< NoteAction >;
	isFullyLocked: boolean;
} {
	const { settingsLockedActions, isPostLocked } = useSelect( ( select ) => {
		const { getEditorSettings, getCurrentPostAttribute } =
			select( editorStore );
		return {
			settingsLockedActions: (
				getEditorSettings() as {
					lockedNoteActions?: NoteAction[];
				}
			 ).lockedNoteActions,
			isPostLocked: !! (
				getCurrentPostAttribute( 'meta' ) as
					| { _wp_notes_locked?: boolean }
					| undefined
			 )?._wp_notes_locked,
		};
	}, [] );

	return useMemo( () => {
		const lockedActions: ReadonlySet< NoteAction > = new Set(
			isPostLocked ? NOTE_LOCK_ACTIONS : settingsLockedActions ?? []
		);

		return {
			lockedActions,
			isFullyLocked: NOTE_LOCK_ACTIONS.every( ( action ) =>
				lockedActions.has( action )
			),
		};
	}, [ settingsLockedActions, isPostLocked ] );
}
