import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import { invalidateReactionNames } from './reaction-display';
import {
	BLOCK_REACTION_PARAM,
	applyReactionSummaryDelta,
	generateReactionsId,
	getBlockReactionsId,
	type BlockReactionSummary,
	type ReactionSummary,
} from './block-reactions';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

const EMPTY_SUMMARY: BlockReactionSummary = {};

/**
 * Every block's reaction summary on the current post, keyed by anchor.
 *
 * Read off the raw post record rather than the edited one: the field is
 * read-only, so no edit ever carries it, and the raw record is what a
 * toggle below updates.
 *
 * @return The summary; a stable empty object when there is none.
 */
export function useBlockReactionSummary(): BlockReactionSummary {
	return useSelect( ( select ) => {
		const { getCurrentPostId, getCurrentPostType } = select( editorStore );
		const postId = getCurrentPostId();
		// A post that has not been saved yet may carry a string id.
		if ( typeof postId !== 'number' ) {
			return EMPTY_SUMMARY;
		}
		const record = select( coreStore ).getEntityRecord(
			'postType',
			getCurrentPostType(),
			postId
		) as { block_reaction_summary?: BlockReactionSummary } | undefined;
		return record?.block_reaction_summary ?? EMPTY_SUMMARY;
	}, [] );
}

/**
 * A block's reactions and a callback to toggle one, the block counterpart
 * of `useReaction( note )`.
 *
 * The block's anchor (`metadata.reactionsId`) is minted on its first
 * reaction, the way the first note on a block writes `metadata.noteId`.
 *
 * @param clientId The block client id.
 * @return The post id, the block's anchor and reaction summary, and the
 *         toggle callback.
 */
export function useBlockReaction( clientId: string ) {
	const summary = useBlockReactionSummary();
	const { postId, postType, reactionsId } = useSelect(
		( select ) => {
			const { getCurrentPostId, getCurrentPostType } =
				select( editorStore );
			const currentPostId = getCurrentPostId();
			return {
				postId: typeof currentPostId === 'number' ? currentPostId : 0,
				postType: getCurrentPostType(),
				reactionsId: getBlockReactionsId(
					select( blockEditorStore ).getBlockAttributes( clientId )
						?.metadata
				),
			};
		},
		[ clientId ]
	);
	const reactions: ReactionSummary | undefined = reactionsId
		? summary[ reactionsId ]
		: undefined;

	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord, receiveEntityRecords } =
		useDispatch( coreStore );
	const { getEntityRecord, getEntityConfig } = useSelect( coreStore );
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const toggleReaction = useCallback(
		async ( hexKey: string ) => {
			if ( ! postId ) {
				return;
			}

			// Mint the anchor before any request, synchronously, so two
			// quick toggles share one. Like the first note on a block, it
			// makes the post dirty until saved.
			const metadata = getBlockAttributes( clientId )?.metadata;
			let anchor = getBlockReactionsId( metadata );
			if ( ! anchor ) {
				anchor = generateReactionsId();
				updateBlockAttributes( clientId, {
					metadata: cleanEmptyObject( {
						...metadata,
						reactionsId: anchor,
					} ),
				} );
			}

			const readSummary = () =>
				(
					getEntityRecord( 'postType', postType, postId ) as
						| { block_reaction_summary?: BlockReactionSummary }
						| undefined
				 )?.block_reaction_summary ?? EMPTY_SUMMARY;
			const writeSummary = ( next: BlockReactionSummary ) =>
				receiveEntityRecords( 'postType', postType, [
					{ id: postId, block_reaction_summary: next },
				] );

			const entry = readSummary()[ anchor ]?.[ hexKey ];
			const myReactionId = entry?.reacted
				? entry.my_reaction_id
				: undefined;
			let addedReactionId: number | undefined;

			try {
				if ( myReactionId ) {
					// Force-delete, as for a note's reactions: reactions
					// have no trash workflow.
					await deleteEntityRecord(
						'root',
						'comment',
						myReactionId,
						{ force: true },
						{ throwOnError: true }
					);
				} else {
					const saved = await saveEntityRecord(
						'root',
						'comment',
						{
							post: postId,
							type: 'reaction',
							parent: 0,
							[ BLOCK_REACTION_PARAM ]: anchor,
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

			invalidateReactionNames(
				{ kind: 'block', postId, reactionsId: anchor },
				hexKey
			);

			// Fold the known effect into the cached post record first, so
			// the next toggle stays correct even if the refetch below fails.
			// A partial record merges over the cached one and leaves unsaved
			// edits alone.
			const current = readSummary();
			const next = applyReactionSummaryDelta(
				current[ anchor ],
				hexKey,
				myReactionId ? undefined : addedReactionId
			);
			const { [ anchor ]: _previous, ...others } = current;
			writeSummary(
				Object.keys( next ).length
					? { ...others, [ anchor ]: next }
					: others
			);

			// Then refetch just the summary for the authoritative counts,
			// which also picks up other users' reactions. Not through
			// `getEntityRecord` with `_fields`: its resolver short-circuits
			// once the field is present, so it would never refetch.
			const baseURL = getEntityConfig( 'postType', postType )?.baseURL;
			try {
				const refreshed = await apiFetch< {
					block_reaction_summary?: BlockReactionSummary | null;
				} >( {
					path: addQueryArgs( `${ baseURL }/${ postId }`, {
						context: 'edit',
						_fields: 'id,block_reaction_summary',
					} ),
				} );
				if ( refreshed?.block_reaction_summary ) {
					writeSummary( refreshed.block_reaction_summary );
				}
			} catch {
				// The local delta above already keeps this block's
				// reactions consistent; the next load reconciles the rest.
			}
		},
		[
			clientId,
			postId,
			postType,
			createNotice,
			deleteEntityRecord,
			getBlockAttributes,
			getEntityConfig,
			getEntityRecord,
			receiveEntityRecords,
			saveEntityRecord,
			updateBlockAttributes,
		]
	);

	return { postId, reactionsId, reactions, toggleReaction };
}
