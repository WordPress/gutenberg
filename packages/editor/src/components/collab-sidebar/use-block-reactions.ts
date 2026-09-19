import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { invalidateReactionNames } from './reaction-display';
import {
	BLOCK_REACTION_PARAM,
	applyBlockReactionDelta,
	ensureBlockReactionsId,
	type BlockReactionSummary,
	type ReactionTarget,
} from './block-reactions';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

const EMPTY_SUMMARY: BlockReactionSummary = {};

interface PostRef {
	postId: number | undefined;
	postType: string | undefined;
}

/**
 * Reads the post's `block_reaction_summary` off a core-data record.
 *
 * @param record A post record, or nothing.
 * @return The summary, if the record carries one.
 */
function readBlockReactionSummary(
	record: unknown
): BlockReactionSummary | undefined {
	return (
		record as { block_reaction_summary?: BlockReactionSummary } | undefined
	 )?.block_reaction_summary;
}

/**
 * The post being edited, as core-data addresses it.
 *
 * @return The post id and type.
 */
export function useCurrentPostRef(): PostRef {
	return useSelect( ( select ) => {
		const { getCurrentPostId, getCurrentPostType } = select( editorStore );
		const postId = getCurrentPostId();
		return {
			// A post that has not been saved yet may carry a string id.
			postId: typeof postId === 'number' ? postId : undefined,
			postType: getCurrentPostType(),
		};
	}, [] );
}

/**
 * Every block's reaction summary on the current post, keyed by anchor.
 *
 * Read off the raw post record rather than the edited one: the field is
 * read-only, so no edit ever carries it, and the raw record is what the
 * optimistic delta and the refetch below update.
 *
 * @return The summary; a stable empty object when there is none.
 */
export function useBlockReactionSummary(): BlockReactionSummary {
	const { postId, postType } = useCurrentPostRef();
	return useSelect(
		( select ) => {
			if ( ! postId || ! postType ) {
				return EMPTY_SUMMARY;
			}
			return (
				readBlockReactionSummary(
					select( coreStore ).getEntityRecord(
						'postType',
						postType,
						postId
					)
				) ?? EMPTY_SUMMARY
			);
		},
		[ postId, postType ]
	);
}

interface ToggleBlockReactionArgs {
	clientId: string;
	emoji: string;
}

/**
 * Adds or removes the current user's reaction on a block.
 *
 * @return `onToggleBlockReaction`, which resolves to `true` once the
 *         reaction has been saved or removed, or `false` if that failed.
 */
export function useBlockReactionActions() {
	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord, receiveEntityRecords } =
		useDispatch( coreStore );
	const { getEntityRecord, getEntityConfig } = useSelect( coreStore );
	const { getCurrentPostId, getCurrentPostType } = useSelect( editorStore );
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const onToggleBlockReaction = useCallback(
		async ( {
			clientId,
			emoji,
		}: ToggleBlockReactionArgs ): Promise< boolean > => {
			const rawPostId = getCurrentPostId();
			if ( typeof rawPostId !== 'number' ) {
				return false;
			}
			const postId: number = rawPostId;
			const postType: string = getCurrentPostType();

			// Mint the anchor before any request, synchronously, so two
			// quick toggles share one anchor. Like the first note on a
			// block it makes the post dirty until saved.
			const reactionsId = ensureBlockReactionsId( clientId, {
				getBlockAttributes,
				updateBlockAttributes,
				cleanEmptyObject,
			} );
			const target: ReactionTarget = {
				kind: 'block',
				postId,
				reactionsId,
			};
			const readSummary = () =>
				readBlockReactionSummary(
					getEntityRecord( 'postType', postType, postId )
				);

			const entry = readSummary()?.[ reactionsId ]?.[ emoji ];
			const myReactionId = entry?.reacted
				? entry.my_reaction_id
				: undefined;
			const isRemoving = !! myReactionId;
			let addedReactionId: number | undefined;

			try {
				if ( myReactionId ) {
					// Force-delete rather than trash: reactions have no
					// trash workflow, and a trashed row would linger in
					// wp_comments each time the user toggles one off.
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
							[ BLOCK_REACTION_PARAM ]: reactionsId,
							content: emoji,
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
				return false;
			}

			// The mutation has landed, so fold its known effect into the
			// cached post record first; that keeps the next toggle correct
			// even if the refetch below never succeeds. A partial record
			// merges over the cached one and leaves unsaved edits alone.
			receiveEntityRecords( 'postType', postType, [
				{
					id: postId,
					block_reaction_summary: applyBlockReactionDelta(
						readSummary(),
						reactionsId,
						emoji,
						isRemoving ? undefined : addedReactionId
					),
				},
			] );
			invalidateReactionNames( target, emoji );

			// Then refetch just the summary for the authoritative counts,
			// which also pick up other users' reactions. Not through
			// getEntityRecord with _fields: its resolver short-circuits
			// once the field is present, so it would never refetch.
			try {
				const baseURL = getEntityConfig(
					'postType',
					postType
				)?.baseURL;
				if ( ! baseURL ) {
					return true;
				}
				const refreshed = await apiFetch< {
					block_reaction_summary?: BlockReactionSummary | null;
				} >( {
					path: addQueryArgs( `${ baseURL }/${ postId }`, {
						context: 'edit',
						_fields: 'id,block_reaction_summary',
					} ),
				} );
				if ( refreshed?.block_reaction_summary ) {
					receiveEntityRecords( 'postType', postType, [
						{
							id: postId,
							block_reaction_summary:
								refreshed.block_reaction_summary,
						},
					] );
				}
			} catch {
				// The toggle itself succeeded and the local delta already
				// keeps this block's reactions consistent; the next load
				// reconciles the rest.
			}
			return true;
		},
		[
			createNotice,
			deleteEntityRecord,
			getBlockAttributes,
			getCurrentPostId,
			getCurrentPostType,
			getEntityConfig,
			getEntityRecord,
			receiveEntityRecords,
			saveEntityRecord,
			updateBlockAttributes,
		]
	);

	return { onToggleBlockReaction };
}
