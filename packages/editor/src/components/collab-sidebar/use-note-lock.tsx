import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '../../store';

/**
 * The note actions a lock can apply to. Mirrors the PHP enum in
 * `lib/compat/wordpress-7.2/notes-locking.php`; reopening a note is classified
 * as `resolve`, and adding or removing a reaction as `react`.
 */
export const NOTE_LOCK_ACTIONS = [
	'create',
	'reply',
	'edit',
	'resolve',
	'delete',
	'react',
] as const;

export type NoteAction = ( typeof NOTE_LOCK_ACTIONS )[ number ];

/**
 * The locked actions the server computed at editor load, for each value of the
 * `_wp_notes_locked` post meta.
 */
type LockedNoteActionsSetting = {
	unlocked?: NoteAction[];
	locked?: NoteAction[];
};

/**
 * Reads which note actions are locked for the post being edited.
 *
 * The `lockedNoteActions` editor setting holds the server's answer, filters
 * included, for both an unlocked and a locked post. The `_wp_notes_locked`
 * post meta, read live off the post entity, picks between them, so a lock
 * applied or lifted mid-session takes effect on the next post refresh.
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
	const settingsLockedActions = useSelect( ( select ) => {
		const { getEditorSettings, getCurrentPostAttribute } =
			select( editorStore );
		const isPostLocked = !! (
			getCurrentPostAttribute( 'meta' ) as
				{ _wp_notes_locked?: boolean } | undefined
		 )?._wp_notes_locked;
		const setting = (
			getEditorSettings() as {
				lockedNoteActions?: LockedNoteActionsSetting;
			}
		 ).lockedNoteActions;
		// Without a server snapshot, a locked post locks everything.
		return isPostLocked
			? ( setting?.locked ?? NOTE_LOCK_ACTIONS )
			: setting?.unlocked;
	}, [] );

	return useMemo( () => {
		const lockedActions: ReadonlySet< NoteAction > = new Set(
			settingsLockedActions ?? []
		);

		return {
			lockedActions,
			isFullyLocked: NOTE_LOCK_ACTIONS.every( ( action ) =>
				lockedActions.has( action )
			),
		};
	}, [ settingsLockedActions ] );
}
