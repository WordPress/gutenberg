/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { select as globalSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

type SelectFunction = typeof globalSelect;

/**
 * Rooms the user has agreed to edit. Once a room is confirmed it is never paused
 * again for the rest of the session.
 */
const confirmedRooms = new Set< string >();

/**
 * Whether the current post contains HTML the current user cannot keep while
 * collaboration is enabled, so editing it would strip CSS or JavaScript.
 *
 * Shared by the pause filter and the warning modal so the two stay in lockstep:
 * the document is paused exactly while the modal is shown.
 *
 * @param select A `@wordpress/data` select function (the global one, or the one
 *               provided to a `useSelect` mapper for reactivity).
 * @return True when the post is gated behind the unfiltered-HTML warning.
 */
export function isCurrentPostUnfilteredHtmlGated(
	select: SelectFunction
): boolean {
	const {
		canUserUseUnfilteredHTML,
		isCollaborationEnabledForCurrentPost,
		getEditorSettings,
	} = unlock( select( editorStore ) );

	return (
		isCollaborationEnabledForCurrentPost() &&
		! canUserUseUnfilteredHTML() &&
		Boolean( getEditorSettings().collaborationContainsUnfilteredHTML )
	);
}

/**
 * The sync room identifier for the current post, or null when unavailable.
 *
 * @param select A `@wordpress/data` select function.
 * @return The room identifier (e.g. `postType/post:123`), or null.
 */
export function getCurrentPostRoom( select: SelectFunction ): string | null {
	const { getCurrentPostType, getCurrentPostId } = select( editorStore );
	const postType = getCurrentPostType();
	const postId = getCurrentPostId();

	if ( ! postType || ! postId ) {
		return null;
	}

	return `postType/${ postType }:${ postId }`;
}

/**
 * Marks a room as confirmed so the polling provider resumes syncing it.
 *
 * @param room The room identifier.
 */
export function confirmRoomSync( room: string ): void {
	confirmedRooms.add( room );
}

/**
 * Whether the user has already confirmed editing a room.
 *
 * @param room The room identifier.
 * @return True when the room has been confirmed.
 */
export function isRoomSyncConfirmed( room: string ): boolean {
	return confirmedRooms.has( room );
}

// Registered at module load (before any sync begins) so the current post's room
// is excluded from the very first poll, and no awareness or document update is
// ever transmitted until the user agrees to edit.
addFilter(
	'sync.pollingProvider.pauseRoom',
	'core/editor/unfiltered-html-warning',
	( paused: boolean, room: string ): boolean => {
		if ( paused || confirmedRooms.has( room ) ) {
			return paused;
		}

		if ( room !== getCurrentPostRoom( globalSelect ) ) {
			return false;
		}

		return isCurrentPostUnfilteredHtmlGated( globalSelect );
	}
);
