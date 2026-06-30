/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { create } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';
import { INLINE_OP_TYPE, useSuggestionsProvider } from './provider';
import { useSuggestionOverlay } from './overlay-context';
import {
	wrapInlineMarker,
	readInlineSelection,
	readInlineCaret,
} from '../inline-markers';
import {
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_TYPE_DELETION,
	buildSuggestionMarkerAttributes,
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
 * Read a rich-text value's plain-text length and its per-character format
 * stacks, tolerating plain strings and other non-rich values.
 *
 * @param {*} value Block attribute value.
 * @return {{ length: number, formats: Array }} Parsed text metrics.
 */
function readValueMetrics( value ) {
	let html = null;
	if ( value && typeof value.toHTMLString === 'function' ) {
		html = value.toHTMLString();
	} else if ( typeof value === 'string' ) {
		html = value;
	}
	if ( html === null ) {
		return { length: 0, formats: [] };
	}
	const record = create( { html } );
	return { length: record.text.length, formats: record.formats ?? [] };
}

/**
 * Whether the character at `index` already carries a `core/suggestion` marker.
 * Used to leave edits inside an existing suggestion to the default path rather
 * than nesting a deletion mark inside another suggestion.
 *
 * @param {Array}  formats Per-character format stacks.
 * @param {number} index   Character index.
 * @return {boolean} True when a suggestion format covers the character.
 */
function hasSuggestionFormatAt( formats, index ) {
	const stack = formats[ index ];
	return (
		Array.isArray( stack ) &&
		stack.some( ( f ) => f.type === SUGGESTION_FORMAT_NAME )
	);
}

/**
 * Turn deletion in Suggest mode into an inline deletion suggestion.
 *
 * In Suggest mode every ordinary edit is a suggestion, so removing text should
 * not delete it — it should mark it as proposed for deletion. This intercepts
 * `beforeinput` (capture phase) for delete input types and, instead of letting
 * the removal happen, wraps the affected text in an in-content
 * `core/suggestion` `<mark data-suggestion-type="del">` marker (Option B) keyed
 * to a freshly created suggestion note.
 *
 * Two shapes are handled:
 *
 * - **Selection delete** — a non-collapsed selection wraps the whole range in
 *   one marker.
 * - **Collapsed-cursor delete** — Backspace marks the character before the
 *   caret, Delete the character after; repeating in the same direction grows a
 *   single marker (the first keystroke opens the note; keystrokes during that
 *   window are counted and applied on flush). A target character already inside
 *   a suggestion marker is left to the default path.
 *
 * `beforeinput` (rather than `keydown`) is the reliable interception point:
 * browsers apply deletion through `beforeinput`, and `preventDefault` there
 * cancels the edit — a `keydown` `preventDefault` does not consistently stop a
 * partial-selection delete, which would let it fall through to the old overlay
 * path.
 *
 * Out of scope for now: word/line deletes at a collapsed cursor
 * (`deleteWordBackward` etc.) and IME composition.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionDeletionKeyboard() {
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

	// The in-progress collapsed-cursor deletion run. `id` is null while the note
	// is being created; repeats in that window accumulate in `steps`. `start`/
	// `end` track the marked span; `dir` is the growth direction.
	const runRef = useRef( null );
	const resetRun = useCallback( () => {
		runRef.current = null;
	}, [] );

	// Open a deletion note for a block, resolving to the new comment id or null.
	const openDeletionNote = useCallback(
		async ( clientId, attributeKey ) => {
			const record = await createSuggestion( {
				clientId,
				blockName: getBlockName( clientId ),
				operations: [
					{
						type: INLINE_OP_TYPE,
						attribute: attributeKey,
						suggestionType: SUGGESTION_TYPE_DELETION,
					},
				],
			} );
			return record?.id ?? null;
		},
		[ createSuggestion, getBlockName ]
	);

	// Wrap [start, end] in a del marker keyed to `id` and write it, optionally
	// moving the caret. Re-wrapping the whole span (used when growing) keeps one
	// format instance across it, so the marker stays a single `<mark>`.
	const writeDeletion = useCallback(
		( clientId, attributeKey, id, start, end, caret ) => {
			const value = getBlockAttributes( clientId )?.[ attributeKey ];
			const wrapped = wrapInlineMarker( value, {
				formatType: SUGGESTION_FORMAT_NAME,
				attributes: buildSuggestionMarkerAttributes( {
					id,
					type: SUGGESTION_TYPE_DELETION,
					authorId,
				} ),
				start,
				end,
			} );
			if ( ! wrapped ) {
				return;
			}
			requestInterceptorBypass( clientId );
			updateBlockAttributes( clientId, { [ attributeKey ]: wrapped } );
			if ( caret !== undefined ) {
				selectionChange( clientId, attributeKey, caret, caret );
			}
		},
		[
			getBlockAttributes,
			updateBlockAttributes,
			selectionChange,
			requestInterceptorBypass,
			authorId,
		]
	);

	// Selection delete: wrap the whole selected range in one marker.
	const deleteSelection = useCallback(
		async ( selection ) => {
			const { clientId, attributeKey, start, end } = selection;
			resetRun();
			try {
				const id = await openDeletionNote( clientId, attributeKey );
				if ( id ) {
					writeDeletion( clientId, attributeKey, id, start, end );
				}
			} catch {
				// `createSuggestion` already surfaces a notice on failure.
			}
		},
		[ openDeletionNote, writeDeletion, resetRun ]
	);

	// Collapsed-cursor delete: mark one character and grow on repeats.
	const deleteCharacter = useCallback(
		async ( clientId, attributeKey, pos, isBackward, textLength ) => {
			const run = runRef.current;
			const isContiguous =
				run &&
				run.id !== null &&
				run.clientId === clientId &&
				run.attributeKey === attributeKey &&
				run.dir === ( isBackward ? 'backward' : 'forward' ) &&
				// Backspace grows leftward from the marker start (caret sits
				// there); Delete grows rightward with the caret held at start.
				run.caret === pos;

			if ( isContiguous ) {
				if ( isBackward ) {
					if ( run.start <= 0 ) {
						return;
					}
					run.start -= 1;
					run.caret = run.start;
				} else {
					if ( run.end >= textLength ) {
						return;
					}
					run.end += 1;
				}
				writeDeletion(
					clientId,
					attributeKey,
					run.id,
					run.start,
					run.end,
					run.caret
				);
				return;
			}

			// Buffer repeats that arrive while a note request is in flight.
			if ( run && run.id === null && run.clientId === clientId ) {
				run.steps += 1;
				return;
			}

			// New run. Anchor the initial single-character range.
			const start = isBackward ? pos - 1 : pos;
			const end = isBackward ? pos : pos + 1;
			const newRun = {
				clientId,
				attributeKey,
				id: null,
				start,
				end,
				caret: isBackward ? start : pos,
				dir: isBackward ? 'backward' : 'forward',
				steps: 1,
			};
			runRef.current = newRun;
			try {
				const id = await openDeletionNote( clientId, attributeKey );
				if ( runRef.current !== newRun ) {
					return;
				}
				if ( ! id ) {
					resetRun();
					return;
				}
				newRun.id = id;
				// Expand by any repeats buffered during creation, clamped to the
				// value's bounds.
				const extra = newRun.steps - 1;
				if ( isBackward ) {
					newRun.start = Math.max( 0, newRun.start - extra );
					newRun.caret = newRun.start;
				} else {
					newRun.end = Math.min( textLength, newRun.end + extra );
				}
				writeDeletion(
					clientId,
					attributeKey,
					id,
					newRun.start,
					newRun.end,
					newRun.caret
				);
			} catch {
				if ( runRef.current === newRun ) {
					resetRun();
				}
			}
		},
		[ openDeletionNote, writeDeletion, resetRun ]
	);

	const onBeforeInput = useCallback(
		( event ) => {
			if ( ! event.inputType?.startsWith( 'delete' ) ) {
				resetRun();
				return;
			}
			if ( ! event.target?.isContentEditable ) {
				resetRun();
				return;
			}

			// Selection delete (any delete input type over a range).
			const selection = readInlineSelection(
				getSelectionStart,
				getSelectionEnd
			);
			if ( selection ) {
				event.preventDefault();
				deleteSelection( selection );
				return;
			}

			// Collapsed-cursor delete: only the single-character backward /
			// forward variants. Word/line deletes fall through for now.
			const isBackward = event.inputType === 'deleteContentBackward';
			const isForward = event.inputType === 'deleteContentForward';
			if ( ! isBackward && ! isForward ) {
				resetRun();
				return;
			}
			const caret = readInlineCaret( getSelectionStart, getSelectionEnd );
			if ( ! caret || caret.start !== caret.end ) {
				resetRun();
				return;
			}
			const { clientId, attributeKey, start: pos } = caret;
			const { length, formats } =
				readValueMetrics(
					getBlockAttributes( clientId )?.[ attributeKey ]
				) ?? {};
			// Nothing to delete at the document edge.
			if (
				( isBackward && pos <= 0 ) ||
				( isForward && pos >= length )
			) {
				resetRun();
				return;
			}
			// Leave edits inside an existing suggestion marker to the default
			// path rather than nesting marks.
			const targetIndex = isBackward ? pos - 1 : pos;
			if ( hasSuggestionFormatAt( formats, targetIndex ) ) {
				resetRun();
				return;
			}

			event.preventDefault();
			deleteCharacter( clientId, attributeKey, pos, isBackward, length );
		},
		[
			getSelectionStart,
			getSelectionEnd,
			getBlockAttributes,
			deleteSelection,
			deleteCharacter,
			resetRun,
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
