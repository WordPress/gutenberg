/**
 * Reads the notes again after a post save that can settle a decision.
 *
 * Accept and Reject leave a note provisional (`applied-unsaved` /
 * `rejected-unsaved`), and the server's save pass makes it final. The save
 * response carries the post, not its notes, so without this the sidebar keeps
 * asking to "Save the post to keep this decision." until a reload.
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { STORE_NAME } from '../../store/constants';
import { hasNotesSupport } from './gate';
import { getNoteThreadsQuery } from '../collab-sidebar/hooks';
import { getSuggestionStatus, isProvisionalStatus } from './suggestion-status';

/**
 * Whether any of the notes carries a decision a post save can make final.
 *
 * @param notes Note records, as core-data returns them.
 * @return True when a note is provisional.
 */
export function hasProvisionalDecision( notes: any[] | null | undefined ) {
	return !! notes?.some( ( note ) =>
		isProvisionalStatus( getSuggestionStatus( note ) )
	);
}

/**
 * Invisible component that refreshes the note list once a save succeeds
 * while a provisional decision is listed.
 *
 * @return Renders nothing.
 */
export default function SuggestionDecisionRefresh() {
	const registry = useRegistry();
	const { isSaving, postId, supportsNotes } = useSelect( ( select ) => {
		const editor = select( STORE_NAME ) as any;
		return {
			isSaving: editor.isSavingPost(),
			postId: editor.getCurrentPostId(),
			supportsNotes: hasNotesSupport( select ),
		};
	}, [] );
	const wasSavingRef = useRef( false );

	useEffect( () => {
		if ( isSaving ) {
			wasSavingRef.current = true;
			return;
		}
		if ( ! wasSavingRef.current ) {
			return;
		}
		wasSavingRef.current = false;
		if (
			! supportsNotes ||
			typeof postId !== 'number' ||
			! (
				registry.select( STORE_NAME ) as any
			 ).didPostSaveRequestSucceed()
		) {
			return;
		}
		const args = [ 'root', 'comment', getNoteThreadsQuery( postId ) ];
		const notes = ( registry.select( coreStore ) as any ).getEntityRecords(
			...args
		);
		if ( hasProvisionalDecision( notes ) ) {
			( registry.dispatch( coreStore ) as any ).invalidateResolution(
				'getEntityRecords',
				args
			);
		}
	}, [ isSaving, postId, supportsNotes, registry ] );

	return null;
}
