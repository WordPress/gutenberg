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
} from '../inline-suggestions';

/**
 * Collect every document the editor canvas might live in: the top document and
 * the contents of each (same-origin) iframe. The canvas is usually iframed and
 * native input events don't cross that boundary, so the listener has to be
 * attached to the canvas document directly. The handler's own guards keep it
 * from acting on edits outside a block's rich text, so attaching broadly is
 * safe.
 *
 * @return {Document[]} Candidate documents.
 */
function getCandidateDocuments() {
	const docs = [ document ];
	for ( const iframe of document.querySelectorAll( 'iframe' ) ) {
		let doc = null;
		try {
			doc = iframe.contentDocument;
		} catch {
			// Cross-origin iframe — not the editor canvas; skip.
			doc = null;
		}
		if ( doc && ! docs.includes( doc ) ) {
			docs.push( doc );
		}
	}
	return docs;
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
			select( EDITOR_STORE_NAME ).getEditorIntent() === SUGGEST_INTENT,
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
	const { getSelectionStart, getSelectionEnd, getBlockAttributes } =
		useSelect( blockEditorStore );
	const { updateBlockAttributes, selectionChange } =
		useDispatch( blockEditorStore );
	const { createSuggestion } = useSuggestionsProvider();
	const { getBlockName } = useSelect( blockEditorStore );
	const { requestInterceptorBypass } = useSuggestionOverlay();

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
					if ( ! delId ) {
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
				// The run may have been abandoned (caret moved, mode change)
				// while the request was in flight.
				if ( runRef.current !== run ) {
					return;
				}
				if ( ! addId ) {
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
			openInlineNote,
			updateBlockAttributes,
			requestInterceptorBypass,
			commit,
			resetRun,
			authorId,
		]
	);

	// Route a unit of inserted text (a typed character or a pasted run) to the
	// right place: buffer it while a note request is in flight, grow the open
	// marker when the caret is still at its trailing edge, or start a new run.
	// `allowGrow` is false for paste so a pasted run is always its own marker.
	const insertText = useCallback(
		( text, allowGrow ) => {
			const inFlight = runRef.current;
			if ( inFlight && inFlight.id === null ) {
				// A note request is still in flight: buffer regardless of where
				// the caret reads now (during a type-over the selection hasn't
				// collapsed yet) and let the flush apply it.
				inFlight.pending += text;
				return;
			}
			const caret = readInlineCaret( getSelectionStart, getSelectionEnd );
			if ( ! caret ) {
				// Block-level / cross-attribute selection: nothing to anchor to.
				resetRun();
				return;
			}
			const { clientId, attributeKey, start, end } = caret;
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
				return;
			}

			beginInsertion( clientId, attributeKey, start, end, text );
		},
		[
			getSelectionStart,
			getSelectionEnd,
			getBlockAttributes,
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
			if ( ! event.target?.isContentEditable ) {
				resetRun();
				return;
			}
			// We own insertion in Suggest mode — cancel the native edit.
			event.preventDefault();
			insertText( text, true );
		},
		[ insertText, resetRun ]
	);

	const onPaste = useCallback(
		( event ) => {
			if ( ! event.target?.isContentEditable ) {
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
			// Stop the editor's own paste handling so this paste becomes a
			// suggestion marker instead of permanent content. `paste` fires
			// ahead of `beforeinput`, so cancelling here is the reliable point.
			event.preventDefault();
			event.stopImmediatePropagation();
			insertText( plain, false );
		},
		[ insertText, resetRun ]
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
