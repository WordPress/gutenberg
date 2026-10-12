/**
 * Create, update and delete: the suggester's half of Suggest mode. The
 * auto-save loop and the inline keyboards call these to persist what the
 * overlay and the inline markers hold. Each one writes through the suggestion
 * store, keeps the block's `metadata.noteId` link in step (outside undo
 * history), and reports failures with a notice.
 */
import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
// @ts-expect-error No exported types
// prettier-ignore
import { store as blockEditorStore, privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { store as interfaceStore } from '@wordpress/interface';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../../store/constants';
import {
	addNoteIdToMetadata,
	getNoteIdsFromMetadata,
	removeNoteIdFromMetadata,
} from '../collab-sidebar/utils';
import { ALL_NOTES_SIDEBAR } from '../collab-sidebar/constants';
import { unlock } from '../../lock-unlock';
import { buildSuggestionPayload } from './operations';
import type { SuggestionOperation } from './operations';
import { useSuggestionStore } from './suggestion-store';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

/**
 * Create/update/delete callbacks for the current editor.
 *
 * @return The submission callbacks.
 */
export function useSuggestionSubmission() {
	const { postId, postModified } = useSelect( ( select ) => {
		const editor: any = select( STORE_NAME );
		const id = editor?.getCurrentPostId?.() ?? null;
		const postType = editor?.getCurrentPostType?.() ?? null;
		const record =
			id && postType
				? select( coreStore ).getEditedEntityRecord(
						'postType',
						postType,
						id
					)
				: null;
		return {
			postId: id,
			postModified: ( record as any )?.modified_gmt ?? null,
		};
	}, [] );

	const store = useSuggestionStore();
	const { createNotice } = useDispatch( noticesStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const {
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent: markNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const { getBlockAttributes: selectBlockAttributes } =
		useSelect( blockEditorStore );

	const createSuggestion = useCallback(
		async ( {
			clientId,
			blockName,
			operations,
		}: {
			clientId?: string;
			blockName: string;
			operations: SuggestionOperation[];
		} ) => {
			if ( ! postId ) {
				throw new Error( 'No post id available for suggestion.' );
			}
			if ( ! operations || operations.length === 0 ) {
				return null;
			}

			const payload = buildSuggestionPayload( {
				blockName,
				baseRevision: postModified,
				operations,
			} );

			try {
				const savedRecord: any = await store.createNote(
					postId,
					payload
				);

				// A post-level suggestion has no block to link.
				if ( savedRecord?.id && clientId ) {
					// Append to the noteId array so a fresh suggestion on a
					// block whose previous note(s) have been applied or
					// rejected coexists with them rather than overwriting
					// the link. Other metadata fields like bindings and name
					// are preserved by `addNoteIdToMetadata`.
					const existingMeta =
						selectBlockAttributes( clientId )?.metadata ?? {};
					/*
					 * The linkage is system bookkeeping, not a user edit: it
					 * must never be captured by undo history. Left
					 * persistent, the first Ctrl+Z after making a suggestion
					 * pops this write instead of the suggestion, leaving the
					 * marker in place.
					 */
					markNextChangeAsNotPersistent?.( { history: 'ignore' } );
					updateBlockAttributes( clientId, {
						metadata: addNoteIdToMetadata(
							existingMeta,
							savedRecord.id
						),
					} );
				}

				if ( savedRecord?.id ) {
					// Surface the new note: when a non-notes sidebar (e.g.
					// post or block settings) is open, switch it to the
					// notes sidebar so the suggestion is immediately
					// visible. A closed sidebar stays closed.
					const activeArea = getActiveComplementaryArea( 'core' );
					if ( activeArea && activeArea !== ALL_NOTES_SIDEBAR ) {
						enableComplementaryArea( 'core', ALL_NOTES_SIDEBAR );
					}
				}

				return savedRecord;
			} catch ( error: any ) {
				createNotice(
					'error',
					error?.message || __( 'Unable to submit suggestion.' ),
					{ type: 'snackbar', isDismissible: true }
				);
				throw error;
			}
		},
		[
			postId,
			postModified,
			store,
			updateBlockAttributes,
			markNextChangeAsNotPersistent,
			selectBlockAttributes,
			createNotice,
			getActiveComplementaryArea,
			enableComplementaryArea,
		]
	);

	/**
	 * Update an existing suggestion's payload (auto-save path). Replaces
	 * the `_wp_suggestion` meta on the comment without changing its author,
	 * status, or thread identity, so the user sees a single note
	 * accumulating edits rather than a new note per save burst.
	 *
	 * @param args            Update arguments.
	 * @param args.commentId  Comment id of the existing suggestion.
	 * @param args.blockName  Block name (recorded on the payload).
	 * @param args.operations Latest operations.
	 * @return The saved comment record.
	 */
	const updateSuggestion = useCallback(
		async ( {
			commentId,
			blockName,
			operations,
		}: {
			commentId: number | string;
			blockName: string;
			operations: SuggestionOperation[];
		} ) => {
			if ( ! commentId ) {
				throw new Error( 'No comment id for suggestion update.' );
			}

			const payload = buildSuggestionPayload( {
				blockName,
				baseRevision: postModified,
				operations,
			} );

			try {
				return await store.updateNote( commentId, payload );
			} catch ( error: any ) {
				createNotice(
					'error',
					error?.message || __( 'Unable to update suggestion.' ),
					{ type: 'snackbar', isDismissible: true }
				);
				throw error;
			}
		},
		[ postModified, store, createNotice ]
	);

	/**
	 * Delete a suggestion. The auto-saver calls this when the overlay is
	 * fully reverted to baseline — the user retracted their edit, so the
	 * note no longer carries a meaningful suggestion.
	 *
	 * @param args           Delete arguments.
	 * @param args.commentId Comment id to trash.
	 * @param args.clientId  Block that links to the note, if known. Its
	 *                       `metadata.noteId` entry is removed so the post
	 *                       does not save a reference to a trashed note.
	 */
	const deleteSuggestion = useCallback(
		async ( {
			commentId,
			clientId,
		}: {
			commentId: number | string | null;
			clientId?: string;
		} ) => {
			if ( ! commentId ) {
				return;
			}
			try {
				await store.trashNote( commentId );

				const metadata = clientId
					? selectBlockAttributes( clientId )?.metadata
					: undefined;
				if (
					clientId &&
					getNoteIdsFromMetadata( metadata ).includes(
						Number( commentId )
					)
				) {
					// Bookkeeping, like the link written on create: keep it
					// out of undo history.
					markNextChangeAsNotPersistent?.( { history: 'ignore' } );
					updateBlockAttributes( clientId, {
						metadata: cleanEmptyObject(
							removeNoteIdFromMetadata(
								metadata,
								Number( commentId )
							)
						),
					} );
				}
			} catch ( error: any ) {
				createNotice(
					'error',
					error?.message || __( 'Unable to remove suggestion.' ),
					{ type: 'snackbar', isDismissible: true }
				);
				throw error;
			}
		},
		[
			store,
			createNotice,
			selectBlockAttributes,
			updateBlockAttributes,
			markNextChangeAsNotPersistent,
		]
	);

	return { createSuggestion, updateSuggestion, deleteSuggestion };
}
