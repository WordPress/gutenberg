/**
 * WordPress dependencies
 */
import { useCallback, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { INLINE_OP_TYPE, useSuggestionsProvider } from './provider';
import {
	SUGGESTION_TYPE_ADDITION,
	SUGGESTION_TYPE_DELETION,
	applyEditPlan,
} from '../inline-suggestions';
import { removeNoteIdFromMetadata } from '../collab-sidebar/utils';

/**
 * Stable comparison key for a `content` attribute value: the HTML string for
 * rich-text values, the string itself otherwise. Used to detect whether the
 * block's live content moved on while a note request was in flight.
 *
 * @param {*} value Block `content` attribute value.
 * @return {string|null} Comparison key, or null for non-string-like values.
 */
export function contentKey( value ) {
	if ( typeof value === 'string' ) {
		return value;
	}
	if ( value && typeof value.toString === 'function' ) {
		return value.toString();
	}
	return null;
}

/**
 * Owns the write side of text-edit suggestions that reach a block as a whole new
 * `content` value rather than a `beforeinput` the typing/deletion keyboards
 * intercept.
 *
 * The keyboards catch plain typing, word/line delete, cut, and single-line paste
 * on their input events and cancel them before the browser applies them. Edits
 * that don't surface as one of those events — a committed IME composition,
 * autocorrect (`insertReplacementText`), a drag-drop, a multi-line paste — fall
 * through to RichText's `onChange`, which the overlay HOC sees as a fresh
 * `content` value. The HOC diffs it into a marker plan (`planEditMarkers`) and,
 * when the plan is one this handler can execute, hands it here; this single
 * mounted component opens the note(s) and writes the marker(s), bypassing the
 * suggest-mode interceptor exactly as the typing keyboards do. Keeping the heavy
 * `useSuggestionsProvider` in one component rather than every block's render is
 * why this is a singleton, mirroring `SuggestionFormatKeyboard`.
 *
 * Only plans whose actions all open a fresh note (`insert-add`, `wrap-del`) are
 * routed here by the HOC; plans that edit an existing marker or that the diff
 * can't resolve are left to the overlay path, so this handler always has a note
 * to create for every id the plan consumes.
 *
 * Writes are serialized per block through the overlay context's shared write
 * queue (shared with `SuggestionFormatKeyboard`), and every write re-validates
 * the block's live content against the snapshot its plan was computed from —
 * the note POST is an async gap during which typing markers, collaborators, or
 * a queued sibling write may have changed the content. A stale plan is
 * abandoned: its just-created notes are trashed and a snackbar tells the user
 * the edit wasn't captured.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionContentReconciler() {
	const authorId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id ?? null,
		[]
	);
	const { createSuggestion, deleteSuggestion } = useSuggestionsProvider();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const { createNotice } = useDispatch( noticesStore );
	const {
		registerContentHandler,
		requestInterceptorBypass,
		enqueueSuggestionWrite,
	} = useSuggestionOverlay();

	// Trash notes created for a plan that was abandoned, and drop their ids
	// from the block's note linkage. Best-effort: a failed trash is already
	// surfaced by `deleteSuggestion`'s own notice.
	const cleanupAbandonedNotes = useCallback(
		async ( clientId, ids ) => {
			if ( ids.length === 0 ) {
				return;
			}
			let metadata = getBlockAttributes( clientId )?.metadata;
			for ( const id of ids ) {
				metadata = removeNoteIdFromMetadata( metadata, id );
			}
			requestInterceptorBypass( clientId );
			updateBlockAttributes( clientId, { metadata } );
			for ( const id of ids ) {
				try {
					await deleteSuggestion( { commentId: id } );
				} catch {
					// `deleteSuggestion` surfaces its own notice.
				}
			}
		},
		[
			getBlockAttributes,
			updateBlockAttributes,
			requestInterceptorBypass,
			deleteSuggestion,
		]
	);

	const notifyDropped = useCallback( () => {
		createNotice(
			'warning',
			__( 'The edit could not be captured as a suggestion.' ),
			{ type: 'snackbar', isDismissible: true }
		);
	}, [ createNotice ] );

	// The queued task: open the plan's notes, then re-validate and write.
	const runContentEdit = useCallback(
		async ( { clientId, blockName, prevContent, plan } ) => {
			const actions = plan.actions;
			const snapshotKey = contentKey( prevContent );
			/*
			 * The plan was diffed against `prevContent`. If the block moved on
			 * while this task waited in the queue, the plan no longer applies —
			 * abandon before creating any notes.
			 */
			if (
				contentKey( getBlockAttributes( clientId )?.content ) !==
				snapshotKey
			) {
				notifyDropped();
				return;
			}
			const ids = [];
			try {
				// Open one note per action that needs a fresh id, in the order
				// the actions appear — the same order `applyEditPlan` consumes
				// `ids`. A `wrap-del` action becomes a deletion note; every other
				// id-consuming action (`insert-add`) becomes an addition note.
				for ( const action of actions ) {
					if ( ! action.newNote ) {
						continue;
					}
					const suggestionType =
						action.type === 'wrap-del'
							? SUGGESTION_TYPE_DELETION
							: SUGGESTION_TYPE_ADDITION;
					const record = await createSuggestion( {
						clientId,
						blockName,
						operations: [
							{
								type: INLINE_OP_TYPE,
								attribute: 'content',
								suggestionType,
							},
						],
					} );
					const id = record?.id;
					if ( ! id ) {
						// A note failed to open; trash the ones already created
						// rather than orphaning half a replace plan.
						await cleanupAbandonedNotes( clientId, ids );
						notifyDropped();
						return;
					}
					ids.push( id );
				}
				/*
				 * The note POSTs are an async gap: re-read the live content at
				 * write time. If it no longer matches the snapshot the plan was
				 * computed from (typing markers landed, a collaborator edited,
				 * an interleaved flush), writing `applyEditPlan( prevContent )`
				 * would clobber those changes — abandon instead.
				 */
				if (
					contentKey( getBlockAttributes( clientId )?.content ) !==
					snapshotKey
				) {
					await cleanupAbandonedNotes( clientId, ids );
					notifyDropped();
					return;
				}
				const marked = applyEditPlan( prevContent, actions, {
					authorId,
					ids,
				} );
				requestInterceptorBypass( clientId );
				updateBlockAttributes( clientId, { content: marked } );
			} catch {
				// `createSuggestion` surfaces its own error notice; trash any
				// notes created before the failure so none are orphaned.
				await cleanupAbandonedNotes( clientId, ids );
				notifyDropped();
			}
		},
		[
			authorId,
			createSuggestion,
			getBlockAttributes,
			updateBlockAttributes,
			requestInterceptorBypass,
			cleanupAbandonedNotes,
			notifyDropped,
		]
	);

	/*
	 * Synchronous front door handed to the overlay HOC. Validates the request
	 * cheaply and returns false when it cannot be processed, so
	 * `wrappedSetAttributes` falls through to the overlay path instead of
	 * swallowing the edit. Processable requests are queued per block — a second
	 * edit arriving while a note POST is in flight waits its turn instead of
	 * being dropped, re-validating against live content when it runs.
	 */
	const handleContentEdit = useCallback(
		( request ) => {
			const actions = request?.plan?.actions ?? [];
			if (
				! request?.clientId ||
				actions.length === 0 ||
				! actions.every( ( action ) => action.newNote ) ||
				contentKey( request.prevContent ) === null
			) {
				return false;
			}
			enqueueSuggestionWrite( request.clientId, () =>
				runContentEdit( request )
			);
			return true;
		},
		[ enqueueSuggestionWrite, runContentEdit ]
	);

	// Register the handler with the overlay context so the per-block HOC can
	// hand content edits off to it. Re-registers whenever the handler identity
	// changes (e.g. `createSuggestion` rebinds on post modification).
	useEffect(
		() => registerContentHandler( handleContentEdit ),
		[ registerContentHandler, handleContentEdit ]
	);

	return null;
}
