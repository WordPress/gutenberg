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
import { readInlineCaret } from '../inline-markers';
import {
	SUGGESTION_TYPE_ADDITION,
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
 * Turn typing in Suggest mode into an inline addition suggestion.
 *
 * In Suggest mode every ordinary edit is a suggestion, so newly typed text
 * should not land as permanent content — it should be wrapped in an in-content
 * `core/suggestion` `<mark data-suggestion-type="add">` marker (Option B) keyed
 * to a freshly created suggestion note. The front-end render-strip then hides
 * the proposed text until the suggestion is accepted.
 *
 * This intercepts `beforeinput` (capture phase) for `insertText` at a collapsed
 * caret, prevents the native insertion, and writes the marked text into content
 * itself. A contiguous run of typing grows a single marker:
 *
 * - The first character of a run creates the suggestion note (async). While the
 *   note id is in flight, further characters are buffered and flushed together
 *   once it resolves — a brief one-time hitch at the start of a run, after which
 *   typing applies synchronously.
 * - Each subsequent contiguous character re-stamps the whole marker span so it
 *   stays one `<mark>` rather than fragmenting per keystroke
 *   (`growInlineAddition`).
 *
 * Out of scope for now (left to the existing path): type-over (typing with a
 * non-collapsed selection — that compound delete+add ships with the rest of the
 * deletion cases), IME composition, and paste.
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
	const {
		getSelectionStart,
		getSelectionEnd,
		getBlockAttributes,
		getBlockName,
	} = useSelect( blockEditorStore );
	const { updateBlockAttributes, selectionChange } =
		useDispatch( blockEditorStore );
	const { createSuggestion } = useSuggestionsProvider();
	const { requestInterceptorBypass } = useSuggestionOverlay();

	// The in-progress addition run. `id` is null while the suggestion note is
	// being created; characters typed in that window queue in `pending` and are
	// flushed when the id resolves. `start`/`end` track the marker's live span;
	// the caret sits at `end`.
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

	const onBeforeInput = useCallback(
		async ( event ) => {
			// Only plain text insertion concerns us. Composition, paste, and
			// deletions are handled elsewhere (or left to the default path).
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
			const caret = readInlineCaret( getSelectionStart, getSelectionEnd );
			if ( ! caret || caret.start !== caret.end ) {
				// Block-level caret, or a non-collapsed selection (type-over):
				// leave to the existing path for now.
				resetRun();
				return;
			}
			const { clientId, attributeKey, start: pos } = caret;

			// We own this insertion — cancel the native edit. Must be
			// synchronous, before any async work below.
			event.preventDefault();

			const run = runRef.current;
			const isContiguous =
				run &&
				run.clientId === clientId &&
				run.attributeKey === attributeKey &&
				run.end === pos;

			// Still creating the note for an active contiguous run: queue the
			// character and let the flush apply it once the id lands.
			if ( isContiguous && run.id === null ) {
				run.pending += text;
				return;
			}

			// Active run with a resolved id, caret still at its trailing edge:
			// grow the existing marker synchronously.
			if ( isContiguous && run.id !== null ) {
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

			// New run: open a note and start a fresh marker. Buffer characters
			// typed before the id resolves, then flush them in one insertion.
			const newRun = {
				clientId,
				attributeKey,
				id: null,
				start: pos,
				end: pos,
				pending: text,
			};
			runRef.current = newRun;

			try {
				const record = await createSuggestion( {
					clientId,
					blockName: getBlockName( clientId ),
					operations: [
						{
							type: INLINE_OP_TYPE,
							attribute: attributeKey,
							suggestionType: SUGGESTION_TYPE_ADDITION,
						},
					],
				} );
				// The run may have been abandoned (caret moved, mode change)
				// while the request was in flight.
				if ( runRef.current !== newRun ) {
					return;
				}
				if ( ! record?.id ) {
					resetRun();
					return;
				}
				const buffered = newRun.pending;
				newRun.id = record.id;
				newRun.pending = '';
				const value = getBlockAttributes( clientId )?.[ attributeKey ];
				const inserted = insertInlineAddition( value, {
					text: buffered,
					attributes: buildSuggestionMarkerAttributes( {
						id: record.id,
						type: SUGGESTION_TYPE_ADDITION,
						authorId,
					} ),
					start: newRun.start,
					end: newRun.start,
				} );
				newRun.end = newRun.start + buffered.length;
				commit( clientId, attributeKey, inserted, newRun.end );
			} catch {
				// `createSuggestion` already surfaces a notice on failure;
				// drop the run so the next keystroke starts clean.
				if ( runRef.current === newRun ) {
					resetRun();
				}
			}
		},
		[
			getSelectionStart,
			getSelectionEnd,
			getBlockAttributes,
			getBlockName,
			createSuggestion,
			commit,
			resetRun,
			authorId,
		]
	);

	useEffect( () => {
		if ( ! isSuggestMode ) {
			resetRun();
			return undefined;
		}
		const docs = getCandidateDocuments();
		const listener = ( event ) => onBeforeInput( event );
		// Capture phase so we cancel the edit before RichText/the browser apply
		// it. `selectedBlockClientId` is in the deps so the listener re-attaches
		// once the canvas iframe (and its document) has mounted.
		for ( const doc of docs ) {
			doc.addEventListener( 'beforeinput', listener, true );
		}
		return () => {
			for ( const doc of docs ) {
				doc.removeEventListener( 'beforeinput', listener, true );
			}
		};
	}, [ isSuggestMode, selectedBlockClientId, onBeforeInput, resetRun ] );

	return null;
}
