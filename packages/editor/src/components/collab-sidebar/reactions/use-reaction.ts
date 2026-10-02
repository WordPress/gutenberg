import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { store as editorStore } from '../../../store';
import { invalidateReactionNames } from './reaction-display';
import type { ReactionSummary } from './reaction-display';

/**
 * The parts of a note comment record that reactions read.
 */
export interface ReactionTarget {
	id: number;
	reaction_summary?: ReactionSummary | null;
}

/**
 * Folds a completed reaction toggle into a cached note record.
 *
 * Used to keep `reaction_summary` usable when the refetch that would
 * normally replace it fails: without it, the next toggle reads a stale
 * `reacted` / `my_reaction_id` pair and takes the wrong branch.
 *
 * @param note            The cached note record.
 * @param hexKey          The reaction hex key that changed.
 * @param addedReactionId The new reaction's comment ID when one was added;
 *                        omitted when one was removed.
 * @return The note with an updated `reaction_summary`.
 */
export function applyReactionDelta< T extends ReactionTarget >(
	note: T,
	hexKey: string,
	addedReactionId?: number
): T {
	const summary: ReactionSummary = { ...( note.reaction_summary || {} ) };
	const entry = summary[ hexKey ];

	if ( addedReactionId ) {
		// Concurrent adds converge server-side on one surviving row, so a
		// repeated ID is already counted.
		if ( entry?.my_reaction_id === addedReactionId ) {
			return note;
		}
		summary[ hexKey ] = {
			count: ( entry?.count || 0 ) + 1,
			reacted: true,
			my_reaction_id: addedReactionId,
		};
	} else if ( entry ) {
		const count = entry.count - 1;
		if ( count > 0 ) {
			summary[ hexKey ] = { count, reacted: false };
		} else {
			delete summary[ hexKey ];
		}
	}

	return { ...note, reaction_summary: summary };
}

/*
 * Per-note count of landed reaction mutations. Each toggle refetches the
 * whole `reaction_summary`, so a refresh issued before a later mutation
 * landed would overwrite that mutation's result; the counter lets it tell.
 * Module-level so every `useReaction` instance shares it.
 */
const reactionMutationCounts = new Map< number, number >();

/**
 * A note's reactions and a callback to toggle one.
 *
 * `reaction_summary` is computed server-side and cached on the note's
 * entity record, so the summary the note carries is the source of truth
 * for whether the current user has already reacted with an emoji.
 *
 * @param note The note comment record.
 * @return The note's reaction summary and the toggle callback.
 */
export function useReaction( note: ReactionTarget ) {
	const { id: noteId, reaction_summary: reactions } = note;
	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord, receiveEntityRecords } =
		useDispatch( coreStore );
	const { getEntityRecord } = useSelect( coreStore );
	const { getCurrentPostId } = useSelect( editorStore );

	const toggleReaction = useCallback(
		async ( hexKey: string ) => {
			const entry = reactions?.[ hexKey ];
			const myReactionId = entry?.reacted
				? entry.my_reaction_id
				: undefined;
			const isRemoving = !! myReactionId;
			let addedReactionId: number | undefined;

			try {
				if ( myReactionId ) {
					// Force-delete the reaction comment rather than
					// trashing it (the WP REST default). Reactions
					// don't have a trash workflow, and a trashed
					// reaction would otherwise linger in `wp_comments`
					// indefinitely each time the user toggles it off.
					await deleteEntityRecord(
						'root',
						'comment',
						myReactionId,
						{ force: true },
						{ throwOnError: true }
					);
				} else {
					// Add a new reaction as a comment record.
					const saved = await saveEntityRecord(
						'root',
						'comment',
						{
							post: getCurrentPostId(),
							type: 'reaction',
							parent: noteId,
							content: hexKey,
							status: 'approve',
						},
						{ throwOnError: true }
					);
					addedReactionId = saved?.id;
				}
			} catch ( error ) {
				const { message, code } = ( error ?? {} ) as {
					message?: string;
					code?: string;
				};
				createNotice(
					'error',
					message && code !== 'unknown_error'
						? decodeEntities( message )
						: __( 'An error occurred while performing an update.' ),
					{ type: 'snackbar', isDismissible: true }
				);
				return;
			}

			// The emoji's reactor list changed, so the pill tooltip refetches.
			invalidateReactionNames( noteId, hexKey );

			// Mutating a reaction comment doesn't invalidate the cached
			// `reaction_summary`, so a subsequent toggle would read stale
			// `reacted` / `my_reaction_id` data and route into the wrong
			// branch (deleting an already-removed comment).
			//
			// The mutation has landed, so fold its known effect into the
			// cached record first. That keeps the next toggle correct even
			// if the refetch below never succeeds.
			const mutationCount =
				( reactionMutationCounts.get( noteId ) ?? 0 ) + 1;
			reactionMutationCounts.set( noteId, mutationCount );

			const cached = getEntityRecord( 'root', 'comment', noteId ) as
				ReactionTarget | undefined;
			if ( cached ) {
				receiveEntityRecords( 'root', 'comment', [
					applyReactionDelta(
						cached,
						hexKey,
						isRemoving ? undefined : addedReactionId
					),
				] );
			}

			// Then refetch the parent note (1 record) for the authoritative
			// summary, which also picks up other users' reactions.
			// `receiveEntityRecords` with no `query` arg updates the
			// per-record cache, which the list selector reads through by ID
			// - so the LIST view picks up the fresh `reaction_summary`
			// without re-fetching every other note on the post. Only the
			// summary is requested and merged, so the view-context response
			// can't replace the cached edit-context fields like
			// `content.raw`, which seeds the edit form.
			try {
				const refreshed = await apiFetch< {
					reaction_summary: ReactionSummary;
				} >( {
					path: addQueryArgs( `/wp/v2/comments/${ noteId }`, {
						_fields: 'id,reaction_summary',
					} ),
				} );
				// A newer mutation landed after this snapshot was requested;
				// its own refresh will carry the authoritative summary.
				if ( reactionMutationCounts.get( noteId ) !== mutationCount ) {
					return;
				}
				const latest = getEntityRecord( 'root', 'comment', noteId );
				if ( latest ) {
					receiveEntityRecords( 'root', 'comment', [
						{
							...latest,
							reaction_summary: refreshed.reaction_summary,
						},
					] );
				}
			} catch {
				// The toggle itself succeeded and the local delta above
				// already keeps this note's reactions consistent, so there
				// is nothing to report; the next load reconciles the rest.
			}
		},
		[
			noteId,
			reactions,
			createNotice,
			deleteEntityRecord,
			saveEntityRecord,
			getCurrentPostId,
			getEntityRecord,
			receiveEntityRecords,
		]
	);

	return { reactions, toggleReaction };
}
