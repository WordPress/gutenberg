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
import { unlock } from '../../lock-unlock';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';
import { INLINE_OP_TYPE, useSuggestionsProvider } from './provider';
import { useSuggestionOverlay } from './overlay-context';
import { wrapInlineMarker, readInlineCaret } from '../inline-markers';
import {
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_TYPE_DELETION,
	buildSuggestionMarkerAttributes,
	formatsRangeHasSuggestion,
	valueRangeHasSuggestion,
} from '../inline-suggestions';
import {
	getCandidateDocuments,
	isEventTargetSelectedRichText,
	readEventRange,
} from './keyboard-target';
import {
	previousGraphemeBoundary,
	nextGraphemeBoundary,
} from './grapheme-boundaries';
import { isPartOfPendingInsertion } from './store-interceptor';

/**
 * Read a rich-text value's plain text and its per-character format stacks,
 * tolerating plain strings and other non-rich values.
 *
 * @param {*} value Block attribute value.
 * @return {{ text: string, length: number, formats: Array }} Parsed text metrics.
 */
function readValueMetrics( value ) {
	let html = null;
	if ( value && typeof value.toHTMLString === 'function' ) {
		html = value.toHTMLString();
	} else if ( typeof value === 'string' ) {
		html = value;
	}
	if ( html === null ) {
		return { text: '', length: 0, formats: [] };
	}
	const record = create( { html } );
	return {
		text: record.text,
		length: record.text.length,
		formats: record.formats ?? [],
	};
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
		getBlockName,
		getBlockParents,
	} = useSelect( blockEditorStore );
	const { updateBlockAttributes, selectionChange } =
		useDispatch( blockEditorStore );
	const { createSuggestion } = useSuggestionsProvider();
	const { requestInterceptorBypass, isDeferredInsertion } =
		useSuggestionOverlay();

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

	// Collapsed-cursor delete: mark one character and grow on repeats. All
	// range arithmetic snaps to grapheme boundaries so surrogate pairs, ZWJ
	// sequences, and combining marks are marked whole — a code-unit step would
	// split them and serialize a lone surrogate (rendered as U+FFFD).
	const deleteCharacter = useCallback(
		async ( clientId, attributeKey, pos, isBackward, text ) => {
			const textLength = text.length;
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
					run.start = previousGraphemeBoundary( text, run.start );
					run.caret = run.start;
				} else {
					if ( run.end >= textLength ) {
						return;
					}
					run.end = nextGraphemeBoundary( text, run.end );
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

			// New run. Anchor the initial single-grapheme range.
			const start = isBackward
				? previousGraphemeBoundary( text, pos )
				: pos;
			const end = isBackward ? pos : nextGraphemeBoundary( text, pos );
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
				// Expand by any repeats buffered during creation, one grapheme
				// per repeat (the boundary helpers clamp at the value's edges).
				for ( let step = newRun.steps - 1; step > 0; step-- ) {
					if ( isBackward ) {
						newRun.start = previousGraphemeBoundary(
							text,
							newRun.start
						);
					} else {
						newRun.end = nextGraphemeBoundary( text, newRun.end );
					}
				}
				if ( isBackward ) {
					newRun.caret = newRun.start;
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
			/*
			 * Only intercept deletion aimed at the rich text the block-editor
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
			 * The store caret identifies the block and attribute (the
			 * event-target guard above already matched the event against it),
			 * but its OFFSETS are synced from the DOM asynchronously and lag
			 * the live caret under fast typing — so offsets come from the DOM
			 * at input time (`readEventRange`), falling back to the store
			 * offsets when no DOM range resolves. Target ranges are not
			 * consulted for deletion: a delete's target range is already
			 * expanded to the text being removed, while this handler needs
			 * the caret/selection that triggered it to keep collapsed-delete
			 * runs growing a single marker.
			 */
			const anchor = readInlineCaret(
				getSelectionStart,
				getSelectionEnd
			);
			if ( ! anchor ) {
				// Block-level / cross-attribute selection: nothing to anchor to.
				resetRun();
				return;
			}
			const { clientId, attributeKey } = anchor;
			/*
			 * Deleting inside a block that is itself a pending insertion — or
			 * a deferred empty placeholder — shrinks the proposed insertion,
			 * it is not a deletion suggestion of its own. Fall through to the
			 * native delete so it writes through to the real block and the
			 * whole block stays ONE "Insert block" note.
			 */
			if (
				isDeferredInsertion( clientId ) ||
				isPartOfPendingInsertion(
					{ getBlockAttributes, getBlockParents },
					clientId
				)
			) {
				resetRun();
				return;
			}
			const domRange = readEventRange( event, {
				preferTargetRanges: false,
			} );
			const start = domRange ? domRange.start : anchor.start;
			const end = domRange ? domRange.end : anchor.end;

			// Selection delete (any delete input type over a range).
			if ( start !== end ) {
				/*
				 * Leave a selection that overlaps an existing suggestion
				 * marker to the default path: `applyFormat` over the range
				 * would re-attribute part of that marker to the new id and
				 * its accept/reject would then act on a partial range.
				 */
				if (
					valueRangeHasSuggestion(
						getBlockAttributes( clientId )?.[ attributeKey ],
						start,
						end
					)
				) {
					resetRun();
					return;
				}
				event.preventDefault();
				deleteSelection( { clientId, attributeKey, start, end } );
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
			const pos = start;
			const { text, length, formats } =
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
			// path rather than nesting marks. The target is the whole
			// grapheme next to the caret, not a single code unit.
			const targetStart = isBackward
				? previousGraphemeBoundary( text, pos )
				: pos;
			const targetEnd = isBackward
				? pos
				: nextGraphemeBoundary( text, pos );
			if (
				formatsRangeHasSuggestion( formats, targetStart, targetEnd )
			) {
				resetRun();
				return;
			}

			event.preventDefault();
			deleteCharacter( clientId, attributeKey, pos, isBackward, text );
		},
		[
			getSelectionStart,
			getSelectionEnd,
			getBlockAttributes,
			getBlockParents,
			isDeferredInsertion,
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
