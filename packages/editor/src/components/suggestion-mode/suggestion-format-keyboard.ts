import { useCallback, useEffect } from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
	// @ts-expect-error No exported types
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { create } from '@wordpress/rich-text';
import { __ } from '@wordpress/i18n';
import { useSuggestionOverlay } from './overlay-context';
import {
	INLINE_OP_TYPE,
	findInlineOp,
	parseSuggestionPayload,
	useSuggestionsProvider,
} from './provider';
import {
	SUGGESTION_TYPE_FORMAT,
	applyFormatPlan,
	rejectInlineFormat,
} from '../inline-suggestions';
import type { FormatPlan } from '../inline-suggestions/reconcile-format';
import { contentKey } from './suggestion-content-reconciler';
import { readLiveInlineSelection } from './keyboard-target';
import { removeNoteIdFromMetadata } from '../collab-sidebar/utils';
import { getNoteThreadsQuery } from '../collab-sidebar/hooks';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

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
 * @return Renders nothing.
 */
export default function SuggestionFormatKeyboard() {
	const authorId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id ?? null,
		[]
	);
	const postId = useSelect(
		( select ) => select( editorStore ).getCurrentPostId(),
		[]
	);
	const { createSuggestion, updateSuggestion, deleteSuggestion } =
		useSuggestionsProvider();
	const {
		updateBlockAttributes,
		selectionChange,
		__unstableMarkNextChangeAsNotPersistent: markNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const { createNotice } = useDispatch( noticesStore );
	const registry = useRegistry();
	const {
		registerFormatHandler,
		requestInterceptorBypass,
		enqueueSuggestionWrite,
	} = useSuggestionOverlay();

	// Trash the note created for an abandoned plan and drop its id from the
	// block's note linkage. Best-effort: a failed trash is already surfaced
	// by `deleteSuggestion`'s own notice.
	const cleanupAbandonedNote = useCallback(
		async ( clientId: string, id: any ) => {
			if ( ! id ) {
				return;
			}
			const metadata = cleanEmptyObject(
				removeNoteIdFromMetadata(
					getBlockAttributes( clientId )?.metadata,
					id
				)
			);
			requestInterceptorBypass( clientId );
			/*
			 * The linkage is bookkeeping, not a user edit, and must never take
			 * an undo level of its own: on the retraction path that level would
			 * pop first, restoring a `noteId` that points at a note this call is
			 * about to trash, instead of undoing the formatting.
			 */
			markNextChangeAsNotPersistent?.( { history: 'ignore' } );
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
			markNextChangeAsNotPersistent,
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

	const notifyKept = useCallback( () => {
		createNotice(
			'info',
			__(
				'Formatting restored. The note is kept because it has replies.'
			),
			{ type: 'snackbar', isDismissible: true }
		);
	}, [ createNotice ] );

	/*
	 * Whether a note may carry replies. Retracting trashes the note, taking
	 * every reply on it with it, so a note someone has answered is revised
	 * instead of withdrawn. Read from the cached thread list the sidebar and the
	 * note collector already load.
	 *
	 * An unresolved list answers "unknown", not "none": the fetch is async, so a
	 * toggle before it lands - or after it failed - would otherwise report no
	 * replies and trash a discussion. The two failure modes are not symmetric.
	 * Keeping a note that proposes nothing is a tidiness problem the user can
	 * resolve; deleting someone's reply cannot be undone. Fail closed.
	 */
	const mayHaveReplies = useCallback(
		( commentId: number | string ) => {
			const threads = registry
				.select( coreStore )
				.getEntityRecords(
					'root',
					'comment',
					getNoteThreadsQuery( postId as number )
				);
			if ( ! threads ) {
				return true;
			}
			return threads.some(
				( thread: any ) =>
					String( thread.parent ) === String( commentId )
			);
		},
		[ registry, postId ]
	);

	/*
	 * Write a marked value to the live block, bypassing the suggest-mode
	 * interceptor.
	 *
	 * Writing re-renders RichText, which re-applies the STORE selection to the
	 * DOM. The note round trip that precedes every call here is an async gap
	 * during which the user may have moved the caret (End, a click), and the
	 * store's selection sync lags the DOM — so the restore would clobber the
	 * live caret and re-select the run, making a fast typist's next keystroke a
	 * type-over. Read the live DOM selection and move the store selection with
	 * the write so the restore lands where the user actually is. A format plan
	 * never changes the text, so the DOM offsets map 1:1 onto the marked value.
	 */
	const writeContent = useCallback(
		( clientId: string, content: any ) => {
			const liveSelection = readLiveInlineSelection(
				clientId,
				'content'
			);
			requestInterceptorBypass( clientId );
			updateBlockAttributes( clientId, { content } );
			if ( liveSelection ) {
				selectionChange(
					clientId,
					'content',
					liveSelection.start,
					liveSelection.end
				);
			}
		},
		[ requestInterceptorBypass, updateBlockAttributes, selectionChange ]
	);

	/*
	 * A second format toggle over a run that already carries this suggester's
	 * own pending `format` marker revises that suggestion rather than opening a
	 * second one (#73411, F-12). The marker's note keeps the original run it
	 * recorded at suggest time — that is what a reject has to restore — and only
	 * its proposed side is updated. When the toggle puts the run back exactly as
	 * that original, the suggestion no longer proposes anything and is retracted
	 * instead of being stored as a note whose before and after are identical —
	 * unless replies have accumulated on it, which no toggle may throw away.
	 */
	const runFormatExtend = useCallback(
		async ( {
			clientId,
			blockName,
			prevContent,
			nextContent,
			plan,
		}: {
			clientId: string;
			blockName: string;
			prevContent: any;
			nextContent: any;
			plan: FormatPlan;
		} ) => {
			const snapshotKey = contentKey( prevContent );
			// Only plans naming an existing marker are routed here.
			const commentId = plan.extendsId!;
			const stale = () =>
				contentKey( getBlockAttributes( clientId )?.content ) !==
				snapshotKey;
			if ( stale() ) {
				notifyDropped();
				return;
			}
			/*
			 * Read the note from the store rather than resolving it: the thread
			 * list is already loaded for every note in the post, and the marker
			 * this plan extends was written from it. Resolving would refetch the
			 * record on every second toggle — the resolution is cached under the
			 * list's argument shape, not this one — and would turn an offline
			 * blip into a dropped edit.
			 */
			let comment: any = registry
				.select( coreStore )
				.getEntityRecord( 'root', 'comment', Number( commentId ) );
			/*
			 * Absent is not the same as resolved-and-gone. The thread list is
			 * fetched asynchronously, so a toggle over a marker on a
			 * freshly-loaded post can arrive before the record exists in the
			 * store - and treating that as "no longer pending" would swallow the
			 * edit. Resolve once, only on that path, which leaves the common
			 * case reading from the cache as before.
			 */
			if ( comment === undefined ) {
				comment = await registry
					.resolveSelect( coreStore )
					.getEntityRecord( 'root', 'comment', Number( commentId ) );
				if ( stale() ) {
					notifyDropped();
					return;
				}
			}
			const existing: any = findInlineOp(
				parseSuggestionPayload( comment?.meta?._wp_suggestion )
					?.operations
			);
			/*
			 * The note has to still be the pending format suggestion the marker
			 * claims it is. A peer accepting or rejecting it mid-toggle (status
			 * off `hold`) leaves the marker about to be cleared, so revising the
			 * note would fight that resolution.
			 */
			if (
				comment?.status !== 'hold' ||
				existing?.suggestionType !== SUGGESTION_TYPE_FORMAT
			) {
				notifyDropped();
				return;
			}
			const beforeHTML = existing.beforeHTML ?? '';
			/*
			 * The note's recorded original and the marker's current run have to
			 * still describe the same characters. A reject replaces the marker's
			 * whole span with that original, so if the run has grown since the
			 * note was written, rejecting would delete the difference along with
			 * the formatting. Compare the text alone - the formatting is exactly
			 * what this suggestion proposes to change.
			 */
			if (
				plan.runText !== undefined &&
				plan.runText !== create( { html: beforeHTML } ).text
			) {
				notifyDropped();
				return;
			}
			/*
			 * The toggle put the run back exactly as the note recorded it, so the
			 * suggestion proposes nothing. Withdraw it — unless replies have
			 * turned the note into a discussion, in which case the note (and its
			 * marker, which anchors it) is kept and revised to propose nothing.
			 */
			const retracting = plan.afterHTML === beforeHTML;
			const keepForReplies = retracting && mayHaveReplies( commentId );
			try {
				if ( retracting && ! keepForReplies ) {
					const restored = rejectInlineFormat(
						nextContent,
						commentId,
						beforeHTML
					);
					if ( restored === nextContent || stale() ) {
						notifyDropped();
						return;
					}
					writeContent( clientId, restored );
					await cleanupAbandonedNote( clientId, commentId );
					return;
				}
				await updateSuggestion( {
					commentId,
					blockName,
					operations: [
						{
							type: INLINE_OP_TYPE,
							attribute: 'content',
							suggestionType: SUGGESTION_TYPE_FORMAT,
							beforeHTML,
							afterHTML: plan.afterHTML,
						},
					],
				} );
				// The update is an async gap; the same re-validation the create
				// path does before writing applies here.
				if ( stale() ) {
					notifyDropped();
					return;
				}
				writeContent( clientId, applyFormatPlan( nextContent, plan ) );
				if ( keepForReplies ) {
					notifyKept();
				}
			} catch {
				// `updateSuggestion` / `deleteSuggestion` surface their own
				// error notices. The note is left as it was.
				notifyDropped();
			}
		},
		[
			registry,
			getBlockAttributes,
			mayHaveReplies,
			updateSuggestion,
			cleanupAbandonedNote,
			writeContent,
			notifyDropped,
			notifyKept,
		]
	);

	// The queued task: open the format note, then re-validate and write.
	const runFormatEdit = useCallback(
		async ( request: any ) => {
			const { clientId, blockName, prevContent, nextContent, plan } =
				request;
			// A plan naming an existing marker revises that suggestion instead
			// of creating a second one over the same run.
			if ( plan.extendsId ) {
				await runFormatExtend( request );
				return;
			}
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
				writeContent(
					clientId,
					applyFormatPlan( nextContent, plan, { id, authorId } )
				);
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
			runFormatExtend,
			writeContent,
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
		( request: any ) => {
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
