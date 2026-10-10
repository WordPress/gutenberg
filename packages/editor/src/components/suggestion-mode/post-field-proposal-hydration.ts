/**
 * Post field proposals restored from the current user's pending notes.
 *
 * A post field proposal (the title, excerpt, a meta key...) is held in the
 * editor store, which a reload empties, while the note it was saved as stays
 * pending. Restoring the proposal from that note means the field shows the
 * proposed value again while suggesting, and editing the field updates the
 * note instead of opening a second one. Editing it back to the post's value
 * withdraws the note, as undo does. Notes by other authors are theirs: they
 * are never restored, so the current user's edit opens a note of their own.
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { STORE_NAME } from '../../store/constants';
import { getPostFieldProposalId } from '../../store/suggest-post-edits';
import { unlock } from '../../lock-unlock';
import { getNoteThreadsQuery } from '../collab-sidebar/hooks';
import { findPostAttributeOps, parseSuggestionPayload } from './operations';
import type { PostFieldProposal } from './operations';

/**
 * The proposals the current user's pending post-level notes hold, keyed by
 * proposal id. A note qualifies when it is a pending top-level note on the
 * post, written by the user, whose only operation is a `post-attribute-set`.
 * When two notes hold the same field (left over from before re-edits
 * updated the note), the newest wins. Pure.
 *
 * @param notes          Note records, as core-data returns them.
 * @param options        Options.
 * @param options.postId The current post id.
 * @param options.userId The current user id.
 * @return Proposals by id, each carrying its note id (`commentId`) and the
 *         value the note holds (`noteValue`).
 */
export function proposalsFromPendingNotes(
	notes: any[] | null | undefined,
	{ postId, userId }: { postId: number; userId: number }
): Record< string, PostFieldProposal > {
	const proposals: Record< string, PostFieldProposal > = {};
	for ( const note of notes ?? [] ) {
		if (
			! note ||
			note.type !== 'note' ||
			note.status !== 'hold' ||
			Number( note.parent ?? 0 ) !== 0 ||
			Number( note.post ) !== Number( postId ) ||
			Number( note.author ) !== Number( userId )
		) {
			continue;
		}
		const operations =
			parseSuggestionPayload( note.meta?._wp_suggestion )?.operations ??
			[];
		const postOps = findPostAttributeOps( operations );
		if ( postOps.length !== 1 || operations.length !== 1 ) {
			continue;
		}
		const [ op ] = postOps;
		if ( typeof op.attribute !== 'string' || ! op.attribute ) {
			continue;
		}
		const key = typeof op.key === 'string' && op.key ? op.key : undefined;
		if ( op.attribute === 'meta' && ! key ) {
			continue;
		}
		const id = getPostFieldProposalId( op.attribute, key );
		const commentId = Number( note.id );
		if ( ( proposals[ id ]?.commentId ?? 0 ) > commentId ) {
			continue;
		}
		proposals[ id ] = {
			attribute: op.attribute,
			...( key ? { key } : {} ),
			baseline: op.before ?? null,
			proposed: op.after ?? null,
			commentId,
			noteValue: op.after ?? null,
		};
	}
	return proposals;
}

/**
 * Restore the current user's pending post field proposals once the post's
 * notes load. A note is restored once per post, and never over a proposal
 * the user already made in this session.
 *
 * @param currentUserId The current user id, or null while unresolved.
 */
export function useHydratePostFieldProposals( currentUserId: number | null ) {
	const registry = useRegistry();
	const { postId, notes } = useSelect( ( select ) => {
		const _postId = ( select( STORE_NAME ) as any ).getCurrentPostId();
		return {
			postId: _postId,
			// A template's id is a string; only posts carry notes.
			notes:
				typeof _postId === 'number'
					? ( select( coreStore ) as any ).getEntityRecords(
							'root',
							'comment',
							getNoteThreadsQuery( _postId )
						)
					: null,
		};
	}, [] );

	const hydratedRef = useRef< { postId: unknown; noteIds: Set< number > } >( {
		postId: undefined,
		noteIds: new Set(),
	} );

	useEffect( () => {
		if ( ! notes || currentUserId === null || typeof postId !== 'number' ) {
			return;
		}
		if ( hydratedRef.current.postId !== postId ) {
			hydratedRef.current = { postId, noteIds: new Set() };
		}
		const { noteIds } = hydratedRef.current;
		const existing = unlock(
			registry.select( STORE_NAME )
		).getPostFieldProposals() as Record< string, PostFieldProposal >;
		const { setPostFieldProposal } = unlock(
			registry.dispatch( STORE_NAME )
		) as any;
		for ( const [ id, proposal ] of Object.entries(
			proposalsFromPendingNotes( notes, {
				postId,
				userId: currentUserId,
			} )
		) ) {
			if ( noteIds.has( proposal.commentId as number ) ) {
				continue;
			}
			noteIds.add( proposal.commentId as number );
			if ( ! existing[ id ] ) {
				setPostFieldProposal( id, proposal );
			}
		}
	}, [ notes, postId, currentUserId, registry ] );
}
