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
import { SUGGESTION_TYPE_FORMAT, applyFormatPlan } from '../inline-suggestions';
import { contentKey } from './suggestion-content-reconciler';
import { readLiveInlineSelection } from './keyboard-target';
import { removeNoteIdFromMetadata } from '../collab-sidebar/utils';

/**
 * Owns the write side of formatting suggestions in Suggest mode.
 *
 * A formatting-only edit (bold/italic/link toggled over a run, the text
 * unchanged) is detected per-block by the overlay HOC's `setAttributes` seam —
 * the one place every format source lands, since a toolbar click, keyboard
 * shortcut, and the link popover all reach the block as a new `content` value
 * with no interceptable DOM event. The HOC only runs the cheap diff; this
 * single mounted component registers the heavy handler (note creation + marker
 * write) so `useSuggestionsProvider` isn't pulled into every block's render.
 *
 * The handler opens a `format` suggestion note (recording the original run as
 * `beforeHTML` so a reject can restore it), then writes the reformatted run
 * wrapped in one `core/suggestion` marker to the live block, bypassing the
 * suggest-mode interceptor exactly as the addition keyboard writes its markers.
 * The text is shown once, carrying the proposed formatting (the Google Docs
 * model), never duplicated.
 *
 * Writes are serialized per block through the overlay context's shared write
 * queue (shared with `SuggestionContentReconciler`), and every write
 * re-validates the block's live content against the snapshot the plan was
 * diffed from — the note POST is an async gap during which typing markers,
 * collaborators, or a queued sibling write may have changed the content. A
 * stale plan is abandoned: its just-created note is trashed and a snackbar
 * tells the user the edit wasn't captured.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionFormatKeyboard() {
	const authorId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id ?? null,
		[]
	);
	const { createSuggestion, deleteSuggestion } = useSuggestionsProvider();
	const { updateBlockAttributes, selectionChange } =
		useDispatch( blockEditorStore );
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const { createNotice } = useDispatch( noticesStore );
	const {
		registerFormatHandler,
		requestInterceptorBypass,
		enqueueSuggestionWrite,
	} = useSuggestionOverlay();

	// Trash the note created for an abandoned plan and drop its id from the
	// block's note linkage. Best-effort: a failed trash is already surfaced
	// by `deleteSuggestion`'s own notice.
	const cleanupAbandonedNote = useCallback(
		async ( clientId, id ) => {
			if ( ! id ) {
				return;
			}
			const metadata = removeNoteIdFromMetadata(
				getBlockAttributes( clientId )?.metadata,
				id
			);
			requestInterceptorBypass( clientId );
			updateBlockAttributes( clientId, { metadata } );
			try {
				await deleteSuggestion( { commentId: id } );
			} catch {
				// `deleteSuggestion` surfaces its own notice.
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
			__(
				'The formatting change could not be captured as a suggestion.'
			),
			{ type: 'snackbar', isDismissible: true }
		);
	}, [ createNotice ] );

	// The queued task: open the format note, then re-validate and write.
	const runFormatEdit = useCallback(
		async ( { clientId, blockName, prevContent, nextContent, plan } ) => {
			const snapshotKey = contentKey( prevContent );
			/*
			 * The plan was diffed against `prevContent`. If the block moved on
			 * while this task waited in the queue, the plan no longer applies —
			 * abandon before creating a note.
			 */
			if (
				contentKey( getBlockAttributes( clientId )?.content ) !==
				snapshotKey
			) {
				notifyDropped();
				return;
			}
			let id = null;
			try {
				const record = await createSuggestion( {
					clientId,
					blockName,
					operations: [
						{
							type: INLINE_OP_TYPE,
							attribute: 'content',
							suggestionType: SUGGESTION_TYPE_FORMAT,
							beforeHTML: plan.beforeHTML,
							afterHTML: plan.afterHTML,
						},
					],
				} );
				id = record?.id ?? null;
				if ( ! id ) {
					notifyDropped();
					return;
				}
				/*
				 * The note POST is an async gap: re-read the live content at
				 * write time. If it no longer matches the snapshot the plan
				 * was diffed from, writing the marked `nextContent` would
				 * clobber whatever landed in between — abandon instead.
				 */
				if (
					contentKey( getBlockAttributes( clientId )?.content ) !==
					snapshotKey
				) {
					await cleanupAbandonedNote( clientId, id );
					notifyDropped();
					return;
				}
				const marked = applyFormatPlan( nextContent, plan, {
					id,
					authorId,
				} );
				/*
				 * Writing the marker re-renders RichText, which re-applies the
				 * STORE selection to the DOM. The note POST above is an async
				 * gap during which the user may have moved the caret (End, a
				 * click), and the store's selection sync lags the DOM — so the
				 * restore would clobber the live caret and re-select the run,
				 * making a fast typist's next keystroke a type-over. Read the
				 * live DOM selection and move the store selection with the
				 * write so the restore lands where the user actually is. A
				 * format plan never changes the text, so the DOM offsets map
				 * 1:1 onto the marked value.
				 */
				const liveSelection = readLiveInlineSelection(
					clientId,
					'content'
				);
				requestInterceptorBypass( clientId );
				updateBlockAttributes( clientId, { content: marked } );
				if ( liveSelection ) {
					selectionChange(
						clientId,
						'content',
						liveSelection.start,
						liveSelection.end
					);
				}
			} catch {
				// `createSuggestion` surfaces its own error notice; trash a
				// note created before the failure so it isn't orphaned.
				await cleanupAbandonedNote( clientId, id );
				notifyDropped();
			}
		},
		[
			authorId,
			createSuggestion,
			getBlockAttributes,
			updateBlockAttributes,
			selectionChange,
			requestInterceptorBypass,
			cleanupAbandonedNote,
			notifyDropped,
		]
	);

	/*
	 * Synchronous front door handed to the overlay HOC. Validates the request
	 * cheaply and returns false when it cannot be processed, so
	 * `wrappedSetAttributes` falls through to the overlay path instead of
	 * swallowing the edit. Processable requests are queued per block — a second
	 * toggle arriving while a note POST is in flight waits its turn instead of
	 * being dropped, re-validating against live content when it runs.
	 */
	const handleFormatEdit = useCallback(
		( request ) => {
			if (
				! request?.clientId ||
				! request?.plan ||
				request.plan.kind !== 'format' ||
				contentKey( request.prevContent ) === null
			) {
				return false;
			}
			enqueueSuggestionWrite( request.clientId, () =>
				runFormatEdit( request )
			);
			return true;
		},
		[ enqueueSuggestionWrite, runFormatEdit ]
	);

	// Register the handler with the overlay context so the per-block HOC can
	// hand format edits off to it. Re-registers whenever the handler identity
	// changes (e.g. `createSuggestion` rebinds on post modification).
	useEffect(
		() => registerFormatHandler( handleFormatEdit ),
		[ registerFormatHandler, handleFormatEdit ]
	);

	return null;
}
