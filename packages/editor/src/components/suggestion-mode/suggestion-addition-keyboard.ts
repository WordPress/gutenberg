import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { pasteHandler } from '@wordpress/blocks';
import { create, concat, toHTMLString } from '@wordpress/rich-text';
import { isURL } from '@wordpress/url';
import { unlock } from '../../lock-unlock';
import { STORE_NAME, EDITOR_INTENT_SUGGEST } from '../../store/constants';
import { INLINE_OP_TYPE } from './operations';
import { useSuggestionsProvider } from './provider';
import { useSuggestionSession } from './suggestion-session';
import useAbandonedNoteCleanup from './use-abandoned-note-cleanup';
import { readInlineCaret, wrapInlineMarker } from '../inline-markers';
import {
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_TYPE_ADDITION,
	SUGGESTION_TYPE_DELETION,
	SUGGESTION_TYPE_REPLACEMENT,
	buildSuggestionMarkerAttributes,
	insertInlineAddition,
	growInlineAddition,
	rejectInlineDeletion,
	reviseOwnAddition,
	valueAdditionRunToExtend,
	valueRangeHasSuggestion,
} from '../inline-suggestions';
import {
	getCandidateDocuments,
	isEventTargetSelectedRichText,
	readEventRange,
	readLiveInlineSelection,
} from './keyboard-target';
import { isPartOfPendingInsertion } from './store-interceptor';
import { notifyEditRefused } from './refuse-edit';
import { readValueText, rebaseRunAnchor } from './run-anchor';

type RunSegment = {
	/** Plain text of the segment. */
	text: string;
	/** Rich HTML when the segment carries inline formats. */
	html?: any;
};

/**
 * The in-progress addition run; see `runRef` in the component below.
 */
type AdditionRun = {
	clientId: string;
	attributeKey: string;
	id: number | string | null;
	start: number;
	end: number;
	caret: number;
	pending: RunSegment[];
	/**
	 * While the note is in flight: the range the run was opened over and the
	 * attribute's text at that moment, so the deferred write can be placed
	 * by content rather than by wherever the caret is when the id resolves.
	 */
	anchor?: { start: number; end: number; text: string };
};

/**
 * Collapse the segments buffered for an addition run into the value to insert.
 * A run is normally one typed character or one pasted string, but characters
 * typed while the note request is in flight queue up behind it, so a rich paste
 * and plain typing can end up in the same marker.
 *
 * `html` is null unless at least one segment carried formatting, which keeps the
 * plain-typing path on the exact same insertion it always used.
 *
 * @param segments Buffered segments, in entry order.
 * @return The combined run.
 */
function mergeRunSegments( segments: RunSegment[] ): {
	text: string;
	html: any;
} {
	let record = create();
	let hasHTML = false;
	for ( const segment of segments ) {
		if ( segment.html ) {
			hasHTML = true;
			record = concat( record, create( { html: segment.html } ) );
		} else {
			record = concat( record, create( { text: segment.text ?? '' } ) );
		}
	}
	return {
		text: record.text,
		html: hasHTML ? toHTMLString( { value: record } ) : null,
	};
}

/**
 * Whether the editor's own paste pipeline would insert this paste as its exact
 * plain text, with no formatting, links, or blocks.
 *
 * Only such a paste is owned by this keyboard. Anything the pipeline transforms
 * is left to it, so a paste in Suggestion mode comes out the same as in
 * Editing mode: Markdown and auto-linked emails gain their formatting, a block
 * that only accepts plain text drops it, a pasted http(s) URL is linked by the
 * link format's paste rule (or becomes an Embed block in an empty paragraph),
 * and a paste that converts to a block such as Math replaces the paragraph.
 * The content reconciler and the store interceptor then propose the result.
 *
 * @param clipboardData Clipboard payload from the paste event.
 * @param plainText     The paste's plain-text flavour.
 * @return True when the paste would land verbatim as plain text.
 */
function isVerbatimPlainPaste(
	clipboardData: any,
	plainText: string
): boolean {
	const trimmed = plainText.trim();
	// Mirrors `core/link`'s `__unstablePasteRule`, which runs ahead of the
	// sanitizer and only links http(s) URLs.
	if ( isURL( trimmed ) && /^https?:/.test( trimmed ) ) {
		return false;
	}
	let html = '';
	try {
		html = clipboardData?.getData?.( 'text/html' ) ?? '';
	} catch {
		// Browsers that expose no clipboard flavours paste plain text anyway.
		return true;
	}
	// Content copied from another rich text in this editor skips the
	// sanitizer, matching `RichText`'s own internal-paste shortcut.
	const isInternal = clipboardData?.getData?.( 'rich-text' ) === 'true';
	const content = isInternal
		? html
		: pasteHandler( { HTML: html, plainText, mode: 'INLINE' } );
	if ( typeof content !== 'string' ) {
		return false;
	}
	const record = create( { html: content } );
	return (
		record.text === plainText &&
		! record.formats.some( ( formats ) => formats?.length ) &&
		! record.replacements.some( Boolean )
	);
}

/**
 * The blocks an http(s) URL pasted into an empty paragraph converts to, or null.
 *
 * Mirrors the paragraph's `__unstableEmbedURLOnPaste`: outside Suggestion mode
 * the paste pipeline first inserts the URL as linked text (so one undo returns
 * to it) and then replaces the paragraph with an Embed block. In Suggestion
 * mode that intermediate text would be proposed as an addition of its own, so
 * the replacement is dispatched directly instead.
 *
 * @param blockName  Name of the block holding the caret.
 * @param attributes That block's attributes.
 * @param plainText  The paste's plain-text flavour.
 * @return The replacement blocks, or null when the paste is not an embed.
 */
function readEmbedPasteBlocks(
	blockName: string | null,
	attributes: any,
	plainText: string
): any[] | null {
	const trimmed = plainText.trim();
	if (
		blockName !== 'core/paragraph' ||
		String( attributes?.content ?? '' ) !== '' ||
		! isURL( trimmed ) ||
		! /^https?:/.test( trimmed )
	) {
		return null;
	}
	const blocks = pasteHandler( { plainText, mode: 'BLOCKS' } );
	return Array.isArray( blocks ) && blocks.length ? blocks : null;
}

/**
 * Turn typing (and simple paste) in Suggest mode into an inline addition
 * suggestion.
 *
 * In Suggest mode every ordinary edit is a suggestion, so newly entered text
 * should not land as permanent content — it is wrapped in an in-content
 * `core/suggestion` `<mark data-suggestion-type="add">` marker (Option B) keyed
 * to a freshly created suggestion note. The front-end render-strip then hides
 * the proposed text until the suggestion is accepted.
 *
 * - Typing intercepts `beforeinput` `insertText` (capture phase), cancels the
 *   native insertion, and writes the marked text itself, advancing the caret
 *   via `selectionChange`. A contiguous run grows one marker: the first
 *   character opens the note (async; characters typed meanwhile buffer and
 *   flush once the id resolves), and each subsequent character re-stamps the
 *   whole marker span so it stays one `<mark>` (`growInlineAddition`). Typing
 *   back inside a pending addition of the author's own grows that marker the
 *   same way, wherever the caret sits in it, so one proposal stays one marker
 *   and one note.
 * - Type-over (entering text with a non-collapsed selection) is one
 *   replacement note: an `add` run for the new text at the selection start,
 *   then a `del` run over the selected text, both keyed to the same note.
 *   Over the author's own pending addition it revises that addition in place
 *   (`reviseOwnAddition`); over anyone else's marker it is refused.
 * - A single-line paste the editor would insert as its exact plain text is
 *   handled on the `paste` event (capture phase, ahead of the editor's own
 *   paste pipeline) and inserted exactly like typed text; over a selection it
 *   is a type-over. Every other paste (multi-line, formatted, Markdown, a URL,
 *   or one that converts to a block) is left to the editor's paste pipeline,
 *   so it matches Editing mode; see `isVerbatimPlainPaste`.
 *
 * Out of scope for now (left to the existing overlay/diff path): IME
 * composition.
 *
 * @return Renders nothing.
 */
export default function SuggestionAdditionKeyboard() {
	const isSuggestMode = useSelect(
		( select ) =>
			// `getEditorIntent` is private while Suggest mode is experimental.
			unlock( select( STORE_NAME ) ).getEditorIntent() ===
			EDITOR_INTENT_SUGGEST,
		[]
	);
	const selectedBlockClientId = useSelect(
		( select ) => select( blockEditorStore ).getSelectedBlockClientId(),
		[]
	);
	const authorId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id ?? null,
		[]
	);
	const {
		getSelectionStart,
		getSelectionEnd,
		getBlockAttributes,
		getBlockParents,
	} = useSelect( blockEditorStore );
	const { updateBlockAttributes, selectionChange, replaceBlocks } =
		useDispatch( blockEditorStore );
	const { createSuggestion, updateSuggestion } = useSuggestionsProvider();
	const { getBlockName } = useSelect( blockEditorStore );
	const { requestInterceptorBypass, isDeferredInsertion } =
		useSuggestionSession();
	const registry = useRegistry();
	const cleanupAbandonedNotes = useAbandonedNoteCleanup();

	// The in-progress addition run. `id` is null while the suggestion note is
	// being created; characters entered in that window queue in `pending` and
	// are flushed when the id resolves. `start`/`end` track the marker's live
	// span and `caret` the insertion point within it — the two only differ when
	// the author resumed typing inside the marker rather than at its end.
	const runRef = useRef< AdditionRun | null >( null );

	const resetRun = useCallback( () => {
		runRef.current = null;
	}, [] );

	// Write a value to the block and advance the caret to the marker's new end,
	// bypassing the suggest-mode interceptor so the marker lands in content
	// rather than being diverted into the overlay.
	const commit = useCallback(
		(
			clientId: string,
			attributeKey: string,
			value: any,
			caret: number
		) => {
			requestInterceptorBypass( clientId );
			updateBlockAttributes( clientId, { [ attributeKey ]: value } );
			selectionChange( clientId, attributeKey, caret, caret );
		},
		[ requestInterceptorBypass, updateBlockAttributes, selectionChange ]
	);

	/*
	 * Write a run the user has moved away from. The caret stays where the
	 * user put it: when it sits later in the same field, it shifts by the
	 * inserted length so it stays on the same character, and so does the
	 * anchor of a run the user opened there in the meantime.
	 */
	const commitDetached = useCallback(
		(
			clientId: string,
			attributeKey: string,
			value: any,
			at: number,
			length: number
		) => {
			const live = readInlineCaret( getSelectionStart, getSelectionEnd );
			const sameField =
				live &&
				live.clientId === clientId &&
				live.attributeKey === attributeKey;
			const selection = sameField
				? ( readLiveInlineSelection( clientId, attributeKey ) ?? live )
				: null;
			requestInterceptorBypass( clientId );
			updateBlockAttributes( clientId, { [ attributeKey ]: value } );
			const inFlight = runRef.current;
			if (
				inFlight?.anchor &&
				inFlight.clientId === clientId &&
				inFlight.attributeKey === attributeKey
			) {
				const text = readValueText( value );
				const moved = rebaseRunAnchor(
					inFlight.anchor,
					inFlight.anchor.text,
					text
				);
				if ( moved ) {
					inFlight.anchor = { ...moved, text };
				}
			}
			if ( selection ) {
				const shift = ( offset: number ) =>
					offset >= at ? offset + length : offset;
				selectionChange(
					clientId,
					attributeKey,
					shift( selection.start ),
					shift( selection.end )
				);
			}
		},
		[
			getSelectionStart,
			getSelectionEnd,
			requestInterceptorBypass,
			updateBlockAttributes,
			selectionChange,
		]
	);

	// Open a fresh inline-suggestion note of the given kind for a block,
	// resolving to the new comment id (or null on failure/empty).
	const openInlineNote = useCallback(
		async (
			clientId: string,
			attributeKey: string,
			suggestionType: string
		) => {
			const record = await createSuggestion( {
				clientId,
				blockName: getBlockName( clientId ),
				operations: [
					{
						type: INLINE_OP_TYPE,
						attribute: attributeKey,
						suggestionType,
					},
				],
			} );
			return record?.id ?? null;
		},
		[ createSuggestion, getBlockName ]
	);

	// Start a fresh addition run: open the note, write the marker(s), and
	// flush any characters buffered while the request was in flight. A
	// non-collapsed range is a type-over (the replacement at the selection
	// start, the selected text marked for deletion after it); a collapsed range
	// is a plain insertion. The run stays open so contiguous typing can grow it.
	const beginInsertion = useCallback(
		async (
			clientId: string,
			attributeKey: string,
			start: number,
			end: number,
			segment: RunSegment
		) => {
			const isTypeOver = start !== end;
			/*
			 * The proposed text goes at the selection start, ahead of the
			 * replaced text, as Google Docs places it: the caret then sits
			 * right after the new text, so Backspace corrects it rather than
			 * reaching the struck-through run.
			 */
			const run: AdditionRun = {
				clientId,
				attributeKey,
				id: null,
				start,
				end: start,
				caret: start,
				pending: [ segment ],
				anchor: {
					start,
					end,
					text: readValueText(
						getBlockAttributes( clientId )?.[ attributeKey ]
					),
				},
			};
			runRef.current = run;
			/*
			 * Whether the live caret still reads the run's block, attribute
			 * and selection, i.e. the user is still at the run and the caret
			 * should follow the written text. The offsets come from the DOM
			 * selection, as `start` / `end` did: the store's offsets lag the
			 * DOM under fast typing, so they only identify the field. Every
			 * keystroke of the run was cancelled, so an unchanged selection
			 * still reads exactly the run's range.
			 */
			const caretStillAnchored = ( range: {
				start: number;
				end: number;
			} ) => {
				const live = readInlineCaret(
					getSelectionStart,
					getSelectionEnd
				);
				if (
					! live ||
					live.clientId !== clientId ||
					live.attributeKey !== attributeKey
				) {
					return false;
				}
				const domRange = readLiveInlineSelection(
					clientId,
					attributeKey
				);
				return (
					! domRange ||
					( domRange.start === range.start &&
						domRange.end === range.end )
				);
			};
			/*
			 * A note opened for a gesture that never wrote its marker has
			 * nothing to accept or reject, and the garbage collector never
			 * trashes an anchor it has not observed: trash it here.
			 */
			const abandon = ( ...ids: any[] ) => {
				if ( runRef.current === run ) {
					resetRun();
				}
				cleanupAbandonedNotes( clientId, ids );
			};
			let id: any = null;
			try {
				/*
				 * A type-over is ONE suggestion: its `add` and `del` runs
				 * carry the same note id, so the sidebar shows a single
				 * "Replace" note and accept/reject resolve both halves.
				 */
				id = await openInlineNote(
					clientId,
					attributeKey,
					isTypeOver
						? SUGGESTION_TYPE_REPLACEMENT
						: SUGGESTION_TYPE_ADDITION
				);
				/*
				 * Every keystroke of the run was cancelled, so the buffered
				 * text belongs where the run was opened, wherever the caret
				 * went in the meantime: clicking another block or pressing
				 * Enter must not discard it (#73411). It is written whenever
				 * the text around that spot is intact, so it can never land
				 * at an offset that now means something else; otherwise, or
				 * when Suggest mode was left, the gesture is dropped.
				 */
				const stillSuggesting =
					unlock(
						registry.select( STORE_NAME )
					).getEditorIntent() === EDITOR_INTENT_SUGGEST;
				const attributes = getBlockAttributes( clientId );
				const anchor =
					id && stillSuggesting && attributes && run.anchor
						? rebaseRunAnchor(
								run.anchor,
								run.anchor.text,
								readValueText( attributes[ attributeKey ] )
							)
						: null;
				if ( ! anchor ) {
					abandon( id );
					return;
				}
				const followCaret =
					runRef.current === run && caretStillAnchored( anchor );
				if ( ! followCaret && runRef.current === run ) {
					// The user moved on: the next keystroke starts afresh.
					resetRun();
				}
				const buffered = mergeRunSegments( run.pending );
				run.id = id;
				run.pending = [];
				run.anchor = undefined;
				run.start = anchor.start;
				/*
				 * Compose the whole gesture into ONE content value — the `del`
				 * marker over the replaced range plus the addition run — and
				 * write it once. A type-over is a single user gesture, so it
				 * must occupy a single undo level.
				 */
				let value = attributes[ attributeKey ];
				if ( isTypeOver ) {
					const deleted = wrapInlineMarker( value, {
						formatType: SUGGESTION_FORMAT_NAME,
						attributes: buildSuggestionMarkerAttributes( {
							id,
							type: SUGGESTION_TYPE_DELETION,
							authorId,
						} ),
						start: anchor.start,
						end: anchor.end,
					} );
					if ( deleted ) {
						value = deleted;
					}
				}
				const inserted = insertInlineAddition( value, {
					text: buffered.text,
					html: buffered.html,
					attributes: buildSuggestionMarkerAttributes( {
						id,
						type: SUGGESTION_TYPE_ADDITION,
						authorId,
					} ),
					start: run.start,
					end: run.start,
				} );
				run.end = run.start + buffered.text.length;
				run.caret = run.end;
				if ( followCaret ) {
					commit( clientId, attributeKey, inserted, run.caret );
				} else {
					commitDetached(
						clientId,
						attributeKey,
						inserted,
						run.start,
						buffered.text.length
					);
				}
			} catch {
				// `createSuggestion` already surfaces a notice on failure; drop
				// the run so the next edit starts clean.
				abandon( id );
			}
		},
		[
			getBlockAttributes,
			getSelectionStart,
			getSelectionEnd,
			openInlineNote,
			commit,
			commitDetached,
			resetRun,
			cleanupAbandonedNotes,
			registry,
			authorId,
		]
	);

	/*
	 * A type-over that reached original text next to the author's own
	 * addition added a `del` run under that addition's note, so the note now
	 * describes a replacement. If the note cannot be updated, the `del` run is
	 * dropped again so the note still matches its markers; the typed text
	 * stays in the addition.
	 */
	const promoteToReplacement = useCallback(
		async ( clientId: string, attributeKey: string, id: string ) => {
			try {
				await updateSuggestion( {
					commentId: id,
					blockName: getBlockName( clientId ),
					operations: [
						{
							type: INLINE_OP_TYPE,
							attribute: attributeKey,
							suggestionType: SUGGESTION_TYPE_REPLACEMENT,
						},
					],
				} );
			} catch {
				// `updateSuggestion` already surfaced a notice.
				requestInterceptorBypass( clientId );
				updateBlockAttributes( clientId, {
					[ attributeKey ]: rejectInlineDeletion(
						getBlockAttributes( clientId )?.[ attributeKey ],
						id
					),
				} );
			}
		},
		[
			updateSuggestion,
			getBlockName,
			getBlockAttributes,
			requestInterceptorBypass,
			updateBlockAttributes,
		]
	);

	/*
	 * Route a unit of inserted content (a typed character or a pasted run,
	 * described by a `RunSegment`) to the right place: buffer it while a note
	 * request is in flight, grow the open marker when the caret is still at its
	 * trailing edge, or start a new run. `allowGrow` is false for paste so a
	 * pasted run is always its own marker — which also means a run only ever
	 * grows by plain typed text.
	 *
	 * Returns whether the input was consumed. Callers must only cancel the
	 * native edit when this returns true — when no valid single-attribute
	 * anchor exists the input has to fall through to the native/overlay path
	 * rather than being swallowed. A gesture this component owns but declines
	 * (a type-over of a marked run) also counts as consumed: cancelling is the
	 * refusal.
	 *
	 * `domRange` carries the DOM-derived offsets for the edit
	 * (`readEventRange`); the store caret is only trusted for block/attribute
	 * identification because its offsets lag the DOM under fast typing.
	 */
	const insertText = useCallback(
		( segment: RunSegment, allowGrow: boolean, domRange: any ) => {
			const text = segment.text;
			const caret = readInlineCaret( getSelectionStart, getSelectionEnd );
			const inFlight = runRef.current;
			if ( inFlight && inFlight.id === null ) {
				/*
				 * A note request is still in flight. Buffer while the caret
				 * still sits where the run was opened: its keystrokes were
				 * cancelled, so the DOM selection is unchanged (during a
				 * type-over it has not collapsed yet). If the user moved to
				 * another block, attribute or offset, leave the run to flush
				 * at its own spot when its id resolves, and start a fresh run
				 * at the new caret below.
				 */
				const anchor = inFlight.anchor;
				if (
					caret &&
					caret.clientId === inFlight.clientId &&
					caret.attributeKey === inFlight.attributeKey &&
					( ! domRange ||
						! anchor ||
						( domRange.start === anchor.start &&
							domRange.end === anchor.end ) )
				) {
					inFlight.pending.push( segment );
					return true;
				}
				resetRun();
			}
			if ( ! caret ) {
				// Block-level / cross-attribute selection: nothing to anchor to.
				resetRun();
				return false;
			}
			const { clientId, attributeKey } = caret;
			/*
			 * Typing inside a block that is itself a pending insertion — or a
			 * deferred empty placeholder about to become one — is part of the
			 * block-insert suggestion, not an inline suggestion of its own.
			 * Fall through to the native edit: it writes through to the real
			 * block (the overlay HOC passes it along and the interceptor
			 * registers/adopts it), so the whole block stays ONE
			 * "Insert block" note instead of gaining a separate "Add" note.
			 */
			if (
				isDeferredInsertion( clientId ) ||
				isPartOfPendingInsertion(
					{ getBlockAttributes, getBlockParents },
					clientId
				)
			) {
				resetRun();
				return false;
			}
			/*
			 * Offsets come from the DOM truth at input time when available.
			 * The store's selection offsets are synced asynchronously and lag
			 * the DOM caret after a marker write re-rendered RichText — a fast
			 * typist's next `beforeinput` would otherwise land the marker at
			 * stale offsets, splitting existing content/markers mid-word.
			 */
			const start = domRange ? domRange.start : caret.start;
			const end = domRange ? domRange.end : caret.end;
			/*
			 * Typing over a selection in the author's own pending addition
			 * revises that proposal, so it is kept in the same marker and
			 * note rather than refused as an overlap below (#73411, B11).
			 */
			if ( start !== end ) {
				const revised = reviseOwnAddition(
					getBlockAttributes( clientId )?.[ attributeKey ],
					{
						start,
						end,
						text,
						html: segment.html ?? undefined,
						authorToken:
							authorId === null || authorId === undefined
								? null
								: String( authorId ),
					}
				);
				if ( revised ) {
					runRef.current = {
						clientId,
						attributeKey,
						id: revised.id,
						start: revised.markerStart,
						end: revised.markerEnd,
						caret: revised.caret,
						pending: [],
					};
					commit(
						clientId,
						attributeKey,
						revised.value,
						revised.caret
					);
					if ( revised.isReplacement ) {
						promoteToReplacement(
							clientId,
							attributeKey,
							revised.id
						);
					}
					return true;
				}
			}
			if (
				start !== end &&
				valueRangeHasSuggestion(
					getBlockAttributes( clientId )?.[ attributeKey ],
					start,
					end
				)
			) {
				/*
				 * Type-over of a selection that overlaps an existing
				 * suggestion marker: wrapping it in the `del` marker would
				 * re-attribute part of that marker to the new id (see
				 * `formatsRangeHasSuggestion`), and the overlay it used to
				 * fall through to would hide that marker (#73411, F-09).
				 * Neither representation fits, so the gesture is consumed and
				 * declined — the caller cancels the native edit, leaving the
				 * existing suggestion exactly as it was.
				 */
				resetRun();
				notifyEditRefused( registry );
				return true;
			}
			const run = runRef.current;
			const isContiguous =
				allowGrow &&
				start === end &&
				run &&
				run.id !== null &&
				run.clientId === clientId &&
				run.attributeKey === attributeKey &&
				run.caret === start;

			if ( isContiguous ) {
				const value = getBlockAttributes( clientId )?.[ attributeKey ];
				const grown = growInlineAddition( value, {
					text,
					attributes: buildSuggestionMarkerAttributes( {
						// The contiguity check above proved the id resolved.
						id: run.id!,
						type: SUGGESTION_TYPE_ADDITION,
						authorId,
					} ),
					markerStart: run.start,
					markerEnd: run.end,
					at: run.caret,
				} );
				run.end += text.length;
				run.caret += text.length;
				commit( clientId, attributeKey, grown, run.caret );
				return true;
			}

			/*
			 * Resuming inside the author's own pending addition — clicking back
			 * into text they already proposed and typing more. Grow that marker
			 * in place: a fresh marker at that offset would split the enclosing
			 * one into two `<mark>` elements sharing an id and leave a second
			 * note claiming characters the first note also reports (#73411,
			 * finding F-06). The marker is resolved from the block's live value
			 * rather than from `runRef`, so it works after a click, a
			 * reload or a caret move away and back.
			 *
			 * Paste merges only when the caret is strictly inside the marker,
			 * where the alternative is that split. At the trailing edge a pasted
			 * run stays its own marker, as `allowGrow` intends.
			 */
			if ( start === end ) {
				const value = getBlockAttributes( clientId )?.[ attributeKey ];
				const extendable = valueAdditionRunToExtend(
					value,
					start,
					authorId === null || authorId === undefined
						? null
						: String( authorId )
				);
				if ( extendable && ( allowGrow || start < extendable.end ) ) {
					const grown = growInlineAddition( value, {
						text,
						html: segment.html,
						attributes: buildSuggestionMarkerAttributes( {
							id: extendable.id,
							type: SUGGESTION_TYPE_ADDITION,
							authorId,
						} ),
						markerStart: extendable.start,
						markerEnd: extendable.end,
						at: start,
					} );
					runRef.current = {
						clientId,
						attributeKey,
						id: extendable.id,
						start: extendable.start,
						end: extendable.end + text.length,
						caret: start + text.length,
						pending: [],
					};
					commit(
						clientId,
						attributeKey,
						grown,
						runRef.current.caret
					);
					return true;
				}
			}

			beginInsertion( clientId, attributeKey, start, end, segment );
			return true;
		},
		[
			getSelectionStart,
			getSelectionEnd,
			getBlockAttributes,
			getBlockParents,
			isDeferredInsertion,
			beginInsertion,
			commit,
			promoteToReplacement,
			registry,
			resetRun,
			authorId,
		]
	);

	const onBeforeInput = useCallback(
		( event: any ) => {
			// Plain typing only. Composition, paste, deletions, and formatting
			// commands reset any open run and fall through to their own paths.
			if ( event.inputType !== 'insertText' ) {
				resetRun();
				return;
			}
			const text = event.data;
			if ( ! text ) {
				return;
			}
			/*
			 * Only intercept input aimed at the rich text the block-editor
			 * selection points at. The capture listeners see every
			 * contentEditable on the page (sidebar note composer, plugin
			 * editables) while a canvas block can still be "selected", so
			 * anything else must fall through natively — without a
			 * preventDefault.
			 */
			if (
				! isEventTargetSelectedRichText( event, getSelectionStart() )
			) {
				resetRun();
				return;
			}
			/*
			 * We own insertion in Suggest mode, but only cancel the native
			 * edit once the caret resolved to a valid single-attribute anchor
			 * — a preventDefault without a subsequent write would silently
			 * drop the typed character.
			 */
			if ( insertText( { text }, true, readEventRange( event ) ) ) {
				event.preventDefault();
			}
		},
		[ getSelectionStart, insertText, resetRun ]
	);

	const onPaste = useCallback(
		( event: any ) => {
			// See `onBeforeInput`: never touch paste aimed at an editable
			// other than the selected block's rich text.
			if (
				! isEventTargetSelectedRichText( event, getSelectionStart() )
			) {
				return;
			}
			const plain = event.clipboardData?.getData?.( 'text/plain' ) ?? '';
			// Only own simple inline paste: a single line of text. Multi-line or
			// block-level clipboard content is left to the editor's paste
			// pipeline (which may create blocks / transform markup), so do NOT
			// preventDefault for it.
			if ( ! plain || /[\r\n]/.test( plain ) ) {
				resetRun();
				return;
			}
			/*
			 * Stop the editor's own paste handling so this paste becomes a
			 * suggestion marker instead of permanent content. `paste` fires
			 * ahead of `beforeinput`, so cancelling here is the reliable
			 * point — but only once the caret resolved to a valid anchor;
			 * otherwise let the editor's paste pipeline have it.
			 */
			const { clientId } = getSelectionStart();
			const embedBlocks = readEmbedPasteBlocks(
				getBlockName( clientId ),
				getBlockAttributes( clientId ),
				plain
			);
			if ( embedBlocks ) {
				event.preventDefault();
				event.stopImmediatePropagation();
				resetRun();
				// The store interceptor proposes the swap as a block
				// replacement, as for any other `replaceBlocks`.
				replaceBlocks(
					clientId,
					embedBlocks,
					embedBlocks.length - 1,
					-1
				);
				return;
			}
			if ( ! isVerbatimPlainPaste( event.clipboardData, plain ) ) {
				resetRun();
				return;
			}
			// A clipboard event exposes no target ranges; `readEventRange`
			// falls back to the live DOM selection.
			const range = readEventRange( event );
			const segment = { text: plain, html: null };
			if ( insertText( segment, false, range ) ) {
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		},
		[
			getSelectionStart,
			getBlockName,
			getBlockAttributes,
			replaceBlocks,
			insertText,
			resetRun,
		]
	);

	useEffect( () => {
		if ( ! isSuggestMode ) {
			resetRun();
			return undefined;
		}
		const docs = getCandidateDocuments();
		const beforeInputListener = ( event: any ) => onBeforeInput( event );
		const pasteListener = ( event: any ) => onPaste( event );
		// Capture phase so we cancel the edit before RichText/the browser apply
		// it. `selectedBlockClientId` is in the deps so the listeners re-attach
		// once the canvas iframe (and its document) has mounted.
		for ( const doc of docs ) {
			doc.addEventListener( 'beforeinput', beforeInputListener, true );
			doc.addEventListener( 'paste', pasteListener, true );
		}
		return () => {
			for ( const doc of docs ) {
				doc.removeEventListener(
					'beforeinput',
					beforeInputListener,
					true
				);
				doc.removeEventListener( 'paste', pasteListener, true );
			}
		};
	}, [
		isSuggestMode,
		selectedBlockClientId,
		onBeforeInput,
		onPaste,
		resetRun,
	] );

	return null;
}
