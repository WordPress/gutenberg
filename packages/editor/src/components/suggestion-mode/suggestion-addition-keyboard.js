/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';
import { INLINE_OP_TYPE, useSuggestionsProvider } from './provider';
import { useSuggestionOverlay } from './overlay-context';
import { readInlineCaret, wrapInlineMarker } from '../inline-markers';
import {
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_TYPE_ADDITION,
	SUGGESTION_TYPE_DELETION,
	buildSuggestionMarkerAttributes,
	insertInlineAddition,
	growInlineAddition,
	valueRangeHasSuggestion,
} from '../inline-suggestions';
import {
	getCandidateDocuments,
	isEventTargetSelectedRichText,
	readEventRange,
} from './keyboard-target';
import { isPartOfPendingInsertion } from './store-interceptor';

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
 *   whole marker span so it stays one `<mark>` (`growInlineAddition`).
 * - Type-over (entering text with a non-collapsed selection) proposes deleting
 *   the selected text (a `del` marker) and adds the replacement (an `add` run
 *   at the selection end), as two independent notes.
 * - A simple single-line paste is handled on the `paste` event (capture phase,
 *   ahead of the editor's own paste pipeline) and inserted exactly like typed
 *   text; over a selection it is a type-over. Multi-line / block-level paste is
 *   left to the editor's paste pipeline.
 *
 * Out of scope for now (left to the existing overlay/diff path): IME
 * composition, and rich/inline formatting carried by a paste (the pasted text
 * is inserted as a plain `add` run).
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionAdditionKeyboard() {
	const isSuggestMode = useSelect(
		( select ) =>
			// `getEditorIntent` is private while Suggest mode is experimental.
			unlock( select( EDITOR_STORE_NAME ) ).getEditorIntent() ===
			SUGGEST_INTENT,
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
	const { updateBlockAttributes, selectionChange } =
		useDispatch( blockEditorStore );
	const { createSuggestion } = useSuggestionsProvider();
	const { getBlockName } = useSelect( blockEditorStore );
	const { requestInterceptorBypass, isDeferredInsertion } =
		useSuggestionOverlay();

	// The in-progress addition run. `id` is null while the suggestion note is
	// being created; characters entered in that window queue in `pending` and
	// are flushed when the id resolves. `start`/`end` track the marker's live
	// span; the caret sits at `end`.
	const runRef = useRef( null );

	const resetRun = useCallback( () => {
		runRef.current = null;
	}, [] );

	// Write a value to the block and advance the caret to the marker's new end,
	// bypassing the suggest-mode interceptor so the marker lands in content
	// rather than being diverted into the overlay.
	const commit = useCallback(
		( clientId, attributeKey, value, caret ) => {
			requestInterceptorBypass( clientId );
			updateBlockAttributes( clientId, { [ attributeKey ]: value } );
			selectionChange( clientId, attributeKey, caret, caret );
		},
		[ requestInterceptorBypass, updateBlockAttributes, selectionChange ]
	);

	// Open a fresh inline-suggestion note of the given kind for a block,
	// resolving to the new comment id (or null on failure/empty).
	const openInlineNote = useCallback(
		async ( clientId, attributeKey, suggestionType ) => {
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

	// Start a fresh addition run: open the note(s), write the marker(s), and
	// flush any characters buffered while the request was in flight. A
	// non-collapsed range is a type-over (propose deleting the selected text,
	// then add the replacement at the selection end); a collapsed range is a
	// plain insertion. The run stays open so contiguous typing can grow it.
	const beginInsertion = useCallback(
		async ( clientId, attributeKey, start, end, text ) => {
			const isTypeOver = start !== end;
			const markerStart = isTypeOver ? end : start;
			const run = {
				clientId,
				attributeKey,
				id: null,
				start: markerStart,
				end: markerStart,
				pending: text,
			};
			runRef.current = run;
			/*
			 * Whether the live caret still reads the run's block and
			 * attribute. Checked after every await: if the user relocated
			 * during the note round trip the run is abandoned — writing the
			 * buffered characters into the old location would materialize
			 * text where the user no longer is. (The already-created note is
			 * left behind; see the orphaned-note known limitation.)
			 */
			const caretStillAnchored = () => {
				const live = readInlineCaret(
					getSelectionStart,
					getSelectionEnd
				);
				return (
					!! live &&
					live.clientId === clientId &&
					live.attributeKey === attributeKey
				);
			};
			try {
				if ( isTypeOver ) {
					const baseValue =
						getBlockAttributes( clientId )?.[ attributeKey ];
					const delId = await openInlineNote(
						clientId,
						attributeKey,
						SUGGESTION_TYPE_DELETION
					);
					if ( runRef.current !== run ) {
						return;
					}
					if ( ! delId || ! caretStillAnchored() ) {
						resetRun();
						return;
					}
					const deleted = wrapInlineMarker( baseValue, {
						formatType: SUGGESTION_FORMAT_NAME,
						attributes: buildSuggestionMarkerAttributes( {
							id: delId,
							type: SUGGESTION_TYPE_DELETION,
							authorId,
						} ),
						start,
						end,
					} );
					if ( deleted ) {
						requestInterceptorBypass( clientId );
						updateBlockAttributes( clientId, {
							[ attributeKey ]: deleted,
						} );
					}
				}

				const addId = await openInlineNote(
					clientId,
					attributeKey,
					SUGGESTION_TYPE_ADDITION
				);
				// The run may have been abandoned (mode change) or the caret
				// may have relocated while the request was in flight.
				if ( runRef.current !== run ) {
					return;
				}
				if ( ! addId || ! caretStillAnchored() ) {
					resetRun();
					return;
				}
				const buffered = run.pending;
				run.id = addId;
				run.pending = '';
				// Wrapping a type-over selection in the `del` marker doesn't
				// change the text length, so `markerStart` (the selection end)
				// is still the insertion point for the replacement.
				const value = getBlockAttributes( clientId )?.[ attributeKey ];
				const inserted = insertInlineAddition( value, {
					text: buffered,
					attributes: buildSuggestionMarkerAttributes( {
						id: addId,
						type: SUGGESTION_TYPE_ADDITION,
						authorId,
					} ),
					start: run.start,
					end: run.start,
				} );
				run.end = run.start + buffered.length;
				commit( clientId, attributeKey, inserted, run.end );
			} catch {
				// `createSuggestion` already surfaces a notice on failure; drop
				// the run so the next edit starts clean.
				if ( runRef.current === run ) {
					resetRun();
				}
			}
		},
		[
			getBlockAttributes,
			getSelectionStart,
			getSelectionEnd,
			openInlineNote,
			updateBlockAttributes,
			requestInterceptorBypass,
			commit,
			resetRun,
			authorId,
		]
	);

	/*
	 * Route a unit of inserted text (a typed character or a pasted run) to the
	 * right place: buffer it while a note request is in flight, grow the open
	 * marker when the caret is still at its trailing edge, or start a new run.
	 * `allowGrow` is false for paste so a pasted run is always its own marker.
	 *
	 * Returns whether the input was consumed. Callers must only cancel the
	 * native edit when this returns true — when no valid single-attribute
	 * anchor exists the input has to fall through to the native/overlay path
	 * rather than being swallowed.
	 *
	 * `domRange` carries the DOM-derived offsets for the edit
	 * (`readEventRange`); the store caret is only trusted for block/attribute
	 * identification because its offsets lag the DOM under fast typing.
	 */
	const insertText = useCallback(
		( text, allowGrow, domRange ) => {
			const caret = readInlineCaret( getSelectionStart, getSelectionEnd );
			const inFlight = runRef.current;
			if ( inFlight && inFlight.id === null ) {
				/*
				 * A note request is still in flight. Buffer as long as the
				 * caret still reads the run's block and attribute — offsets
				 * are ignored because during a type-over the selection hasn't
				 * collapsed yet. If the user clicked into a different block or
				 * attribute during the round trip, abandon the run instead:
				 * the buffered characters were never rendered (their edits
				 * were cancelled), so flushing them would materialize text at
				 * a place the user has already left. The current keystroke
				 * then starts a fresh run at the new caret below.
				 */
				if (
					caret &&
					caret.clientId === inFlight.clientId &&
					caret.attributeKey === inFlight.attributeKey
				) {
					inFlight.pending += text;
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
				 * `formatsRangeHasSuggestion`). Fall through to the
				 * native/overlay path instead of intercepting.
				 */
				resetRun();
				return false;
			}
			const run = runRef.current;
			const isContiguous =
				allowGrow &&
				start === end &&
				run &&
				run.id !== null &&
				run.clientId === clientId &&
				run.attributeKey === attributeKey &&
				run.end === start;

			if ( isContiguous ) {
				const value = getBlockAttributes( clientId )?.[ attributeKey ];
				const grown = growInlineAddition( value, {
					text,
					attributes: buildSuggestionMarkerAttributes( {
						id: run.id,
						type: SUGGESTION_TYPE_ADDITION,
						authorId,
					} ),
					markerStart: run.start,
					markerEnd: run.end,
				} );
				run.end += text.length;
				commit( clientId, attributeKey, grown, run.end );
				return true;
			}

			beginInsertion( clientId, attributeKey, start, end, text );
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
			resetRun,
			authorId,
		]
	);

	const onBeforeInput = useCallback(
		( event ) => {
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
			if ( insertText( text, true, readEventRange( event ) ) ) {
				event.preventDefault();
			}
		},
		[ getSelectionStart, insertText, resetRun ]
	);

	const onPaste = useCallback(
		( event ) => {
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
			// A clipboard event exposes no target ranges; `readEventRange`
			// falls back to the live DOM selection.
			if ( insertText( plain, false, readEventRange( event ) ) ) {
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		},
		[ getSelectionStart, insertText, resetRun ]
	);

	useEffect( () => {
		if ( ! isSuggestMode ) {
			resetRun();
			return undefined;
		}
		const docs = getCandidateDocuments();
		const beforeInputListener = ( event ) => onBeforeInput( event );
		const pasteListener = ( event ) => onPaste( event );
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
