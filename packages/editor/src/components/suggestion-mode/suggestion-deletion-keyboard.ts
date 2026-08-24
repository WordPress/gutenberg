import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { RichTextData, create, slice } from '@wordpress/rich-text';
import { unlock } from '../../lock-unlock';
import { STORE_NAME, EDITOR_INTENT_SUGGEST } from '../../store/constants';
import { INLINE_OP_TYPE, useSuggestionsProvider } from './provider';
import { useSuggestionOverlay } from './overlay-context';
import { wrapInlineMarker, readInlineCaret } from '../inline-markers';
import {
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_TYPE_DELETION,
	buildSuggestionMarkerAttributes,
	computeDeleteRange,
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
import { notifyEditRefused } from './refuse-edit';

/**
 * Read a rich-text value's plain text and its per-character format stacks,
 * tolerating plain strings and other non-rich values.
 *
 * @param value Block attribute value.
 * @return Parsed text metrics.
 */
function readValueMetrics( value: any ): {
	text: string;
	length: number;
	formats: any[];
} {
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
 * Serialize a slice of a rich-text attribute value to an HTML string,
 * preserving inline formatting (bold, links, …). Used by the cut handler to
 * write a `text/html` clipboard flavor alongside `text/plain`, so pasting the
 * cut run elsewhere keeps its formatting. Exported for unit tests.
 *
 * @param value Block attribute value (RichTextData, string, other).
 * @param start Slice start (character offset).
 * @param end   Slice end (character offset).
 * @return HTML of the sliced run; empty for non-string-like values.
 */
export function sliceValueToHTML(
	value: any,
	start: number,
	end: number
): string {
	let html = null;
	if ( value && typeof value.toHTMLString === 'function' ) {
		html = value.toHTMLString();
	} else if ( typeof value === 'string' ) {
		html = value;
	}
	if ( html === null ) {
		return '';
	}
	const record = create( { html } );
	return new RichTextData(
		slice( record as any, start, end ) as any
	).toHTMLString();
}

/**
 * Whether an in-progress collapsed-delete run continues at this caret.
 *
 * A run only continues in the direction it started, in the same block and
 * attribute, once its note id has resolved, and with the caret still parked
 * where the run left it.
 *
 * @param run                  The run in progress, or null.
 * @param context              The current keystroke's context.
 * @param context.clientId     Block client id.
 * @param context.attributeKey Rich-text attribute name.
 * @param context.isBackward   True for Backspace, false for Delete.
 * @param context.pos          Collapsed caret offset.
 * @return True when this keystroke grows `run`.
 */
export function isContiguousDeleteRun(
	run: any,
	{
		clientId,
		attributeKey,
		isBackward,
		pos,
	}: {
		clientId: string;
		attributeKey: string;
		isBackward: boolean;
		pos: number;
	}
): boolean {
	return Boolean(
		run &&
			run.id !== null &&
			run.clientId === clientId &&
			run.attributeKey === attributeKey &&
			run.dir === ( isBackward ? 'backward' : 'forward' ) &&
			run.caret === pos
	);
}

/**
 * Resolve the grapheme range a collapsed delete should mark next.
 *
 * Backspace walks the caret leftward as it marks, so on a repeat the caret is
 * already sitting on fresh text and locates the target by itself. Delete does
 * not move the caret at all — it leaves it parked at the start of what it has
 * marked — so on a repeat the grapheme *at* the caret is the one the previous
 * press already marked. Reading the target from the run's far edge instead is
 * what lets a Delete run grow the same marker the way a Backspace run does;
 * without it every repeat looks like an edit inside an existing marker and
 * gets refused.
 *
 * Returns null at the value's edge, where there is nothing left to mark.
 *
 * @param text       Plain text of the attribute value.
 * @param pos        Collapsed caret offset.
 * @param isBackward True for Backspace, false for Delete.
 * @param run        The contiguous run in progress, if any.
 * @return Range to mark, or null at the edge.
 */
export function collapsedDeleteTarget(
	text: string,
	pos: number,
	isBackward: boolean,
	run?: any
): { start: number; end: number } | null {
	// The leading edge: the caret for a fresh run, the run's growing side for a
	// repeat.
	let from = pos;
	if ( run ) {
		from = isBackward ? run.start : run.end;
	}
	if ( isBackward ) {
		if ( from <= 0 ) {
			return null;
		}
		return { start: previousGraphemeBoundary( text, from ), end: from };
	}
	if ( from >= text.length ) {
		return null;
	}
	return { start: from, end: nextGraphemeBoundary( text, from ) };
}

/**
 * Decide what a collapsed single-grapheme delete should do.
 *
 * Three outcomes:
 *
 * - `mark` — wrap the target grapheme in a deletion marker.
 * - `refuse` — decline the keystroke and tell the user why (`refuseDeletion`).
 *   The grapheme already carries a marker, so the edit fits neither
 *   representation. A caret lands there mid-run (a forward run parks it inside
 *   its own marker) but also from a plain arrow key next to a marker an earlier
 *   run left behind.
 * - `default` — let the browser handle it: a caret at a block edge still merges
 *   blocks natively.
 *
 * Only `mark` continues a run. Neither refusal can grow one, so the caller ends
 * the run either way — left in place it would keep testing as contiguous at a
 * caret `preventDefault` never moved, against a range that may no longer exist.
 *
 * @param options
 * @param options.text       Plain text of the attribute value.
 * @param options.formats    Per-character format stacks.
 * @param options.pos        Collapsed caret offset.
 * @param options.isBackward True for Backspace, false for Delete.
 * @param options.run        The contiguous run in progress, if any.
 * @return What this keystroke should do.
 */
export function collapsedDeleteDisposition( {
	text,
	formats,
	pos,
	isBackward,
	run,
}: {
	text: string;
	formats: any[];
	pos: number;
	isBackward: boolean;
	run?: any;
} ): 'mark' | 'refuse' | 'default' {
	const target = collapsedDeleteTarget( text, pos, isBackward, run );
	if ( ! target ) {
		/*
		 * Nothing left to mark. Mid-run a forward delete's caret is parked at
		 * the start of its own marker, so the browser would eat marked text.
		 * Every other case is a real block edge: Backspace at offset 0 still
		 * merges with the previous block.
		 */
		return run && ! isBackward ? 'refuse' : 'default';
	}
	return formatsRangeHasSuggestion( formats, target.start, target.end )
		? 'refuse'
		: 'mark';
}

/**
 * The in-progress collapsed-cursor deletion run; see `runRef` in the component
 * below.
 */
type DeletionRun = {
	clientId: string;
	attributeKey: string;
	id: number | string | null;
	start: number;
	end: number;
	caret: number;
	dir: string;
	steps: number;
};

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
 * - **Word / line delete** — a word- or line-delete at a collapsed caret
 *   (`deleteWordBackward`, `deleteHardLineForward`, ...) resolves the range it
 *   would remove (`computeDeleteRange`) and marks that whole range as one
 *   deletion, so these no longer fall through to the overlay diff path.
 *
 * `beforeinput` (rather than `keydown`) is the reliable interception point:
 * browsers apply deletion through `beforeinput`, and `preventDefault` there
 * cancels the edit — a `keydown` `preventDefault` does not consistently stop a
 * partial-selection delete, which would let it fall through to the old overlay
 * path.
 *
 * Out of scope for now: IME composition.
 *
 * @return Renders nothing.
 */
export default function SuggestionDeletionKeyboard() {
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
		getBlockName,
		getBlockParents,
	} = useSelect( blockEditorStore );
	const { updateBlockAttributes, selectionChange } =
		useDispatch( blockEditorStore );
	const { createSuggestion } = useSuggestionsProvider();
	const { requestInterceptorBypass, isDeferredInsertion } =
		useSuggestionOverlay();
	const registry = useRegistry();

	/*
	 * A deletion whose range overlaps an existing marker can be expressed
	 * neither as a marker (`applyFormat` over the range would re-attribute
	 * part of the existing marker to the new id, so its accept/reject would
	 * act on a partial range) nor as an overlay (a whole-attribute snapshot
	 * is marker-free, so it would hide the existing marker — #73411, F-09).
	 * Cancel the native edit and say so, rather than letting the browser
	 * apply it and the overlay swallow the result.
	 */
	const refuseDeletion = useCallback(
		( event: any ) => {
			event.preventDefault();
			notifyEditRefused( registry );
		},
		[ registry ]
	);

	// The in-progress collapsed-cursor deletion run. `id` is null while the note
	// is being created; repeats in that window accumulate in `steps`. `start`/
	// `end` track the marked span; `dir` is the growth direction.
	const runRef = useRef< DeletionRun | null >( null );
	const resetRun = useCallback( () => {
		runRef.current = null;
	}, [] );

	// Open a deletion note for a block, resolving to the new comment id or null.
	const openDeletionNote = useCallback(
		async ( clientId: string, attributeKey: string ) => {
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
		(
			clientId: string,
			attributeKey: string,
			id: any,
			start: number,
			end: number,
			caret?: number
		) => {
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
		async ( selection: {
			clientId: string;
			attributeKey: string;
			start: number;
			end: number;
		} ) => {
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
		async (
			clientId: string,
			attributeKey: string,
			pos: number,
			isBackward: boolean,
			text: string
		) => {
			const run = runRef.current;

			// Backspace grows leftward from the marker start (the caret sits
			// there); Delete grows rightward with the caret held at start.
			if (
				isContiguousDeleteRun( run, {
					clientId,
					attributeKey,
					isBackward,
					pos,
				} )
			) {
				const target = collapsedDeleteTarget(
					text,
					pos,
					isBackward,
					run
				);
				if ( ! target ) {
					return;
				}
				// The contiguity check above proved the run exists.
				if ( isBackward ) {
					run!.start = target.start;
					run!.caret = run!.start;
				} else {
					run!.end = target.end;
				}
				writeDeletion(
					clientId,
					attributeKey,
					run!.id,
					run!.start,
					run!.end,
					run!.caret
				);
				return;
			}

			// Buffer repeats that arrive while a note request is in flight.
			if ( run && run.id === null && run.clientId === clientId ) {
				run.steps += 1;
				return;
			}

			// New run. Anchor the initial single-grapheme range.
			const anchored = collapsedDeleteTarget( text, pos, isBackward );
			if ( ! anchored ) {
				return;
			}
			const { start, end } = anchored;
			const newRun: DeletionRun = {
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
		( event: any ) => {
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
				// A selection overlapping an existing marker is declined; see
				// `refuseDeletion`.
				if (
					valueRangeHasSuggestion(
						getBlockAttributes( clientId )?.[ attributeKey ],
						start,
						end
					)
				) {
					resetRun();
					refuseDeletion( event );
					return;
				}
				event.preventDefault();
				deleteSelection( { clientId, attributeKey, start, end } );
				return;
			}

			// Collapsed-cursor delete.
			const pos = start;
			const { text, formats } = readValueMetrics(
				getBlockAttributes( clientId )?.[ attributeKey ]
			);

			const isBackward = event.inputType === 'deleteContentBackward';
			const isForward = event.inputType === 'deleteContentForward';

			// Single-character delete: mark one character and grow on repeats.
			if ( isBackward || isForward ) {
				/*
				 * A repeat of the run in progress grows the marker it already
				 * opened, so its target comes from the run's far edge rather
				 * than from the caret. This matters for Delete, which parks
				 * the caret at the marker start: without it every repeat would
				 * aim at a character the previous press had already marked,
				 * read as an edit inside an existing marker, and get refused.
				 */
				const run = isContiguousDeleteRun( runRef.current, {
					clientId,
					attributeKey,
					isBackward,
					pos,
				} )
					? runRef.current
					: null;
				const disposition = collapsedDeleteDisposition( {
					text,
					formats,
					pos,
					isBackward,
					run,
				} );
				if ( disposition !== 'mark' ) {
					// Neither outcome can grow the run, so it ends here.
					resetRun();
					if ( disposition === 'refuse' ) {
						refuseDeletion( event );
					}
					return;
				}
				event.preventDefault();
				deleteCharacter(
					clientId,
					attributeKey,
					pos,
					isBackward,
					text
				);
				return;
			}

			// Word / line delete: resolve the exact range the delete would
			// remove and mark it as one deletion. Closes the seam where these
			// used to fall through to the overlay diff path.
			const range = computeDeleteRange( text, pos, event.inputType );
			if ( ! range ) {
				resetRun();
				return;
			}
			// A word/line range overlapping an existing marker is declined
			// rather than nesting marks; see `refuseDeletion`.
			if (
				formatsRangeHasSuggestion( formats, range.start, range.end )
			) {
				resetRun();
				refuseDeletion( event );
				return;
			}
			event.preventDefault();
			deleteSelection( {
				clientId,
				attributeKey,
				start: range.start,
				end: range.end,
			} );
		},
		[
			getSelectionStart,
			getSelectionEnd,
			getBlockAttributes,
			getBlockParents,
			isDeferredInsertion,
			deleteSelection,
			deleteCharacter,
			refuseDeletion,
			resetRun,
		]
	);

	// Cut (Cmd/Ctrl+X). `preventDefault` on the `deleteByCut` `beforeinput` does
	// not reliably cancel the removal in Chromium — the `cut` event drives it —
	// so cut is handled on the `cut` event, mirroring how the addition keyboard
	// owns `paste`. The copy half is preserved by writing the selected text to
	// the clipboard ourselves; the delete half becomes a `del` marker instead of
	// removing the text. `cut` fires ahead of the `beforeinput`, so cancelling
	// here stops the `deleteByCut` from also firing (no double-marking).
	const onCut = useCallback(
		( event: any ) => {
			/*
			 * Only intercept a cut aimed at the rich text the block-editor
			 * selection points at — the capture listener sees every
			 * contentEditable on the page (sidebar note composer, plugin
			 * editables); anything else must fall through natively.
			 */
			if (
				! isEventTargetSelectedRichText( event, getSelectionStart() )
			) {
				return;
			}
			/*
			 * Anchor (block + attribute) from the store; offsets from the DOM
			 * truth at cut time (`cut` is a clipboard event with no target
			 * ranges, so this reads the live selection), falling back to the
			 * store offsets. See `onBeforeInput`.
			 */
			const anchor = readInlineCaret(
				getSelectionStart,
				getSelectionEnd
			);
			if ( ! anchor ) {
				resetRun();
				return;
			}
			const domRange = readEventRange( event );
			const { clientId, attributeKey } = anchor;
			const start = domRange ? domRange.start : anchor.start;
			const end = domRange ? domRange.end : anchor.end;
			if ( start === end ) {
				// Collapsed caret: nothing selected to cut.
				resetRun();
				return;
			}
			const value = getBlockAttributes( clientId )?.[ attributeKey ];
			const { formats, text } = readValueMetrics( value );
			/*
			 * Preserve the copy half of cut: put the selected run on the
			 * clipboard as plain text AND as HTML (so pasting elsewhere keeps
			 * bold/links/other inline formatting), then cancel the browser's
			 * delete so the text is marked for deletion instead of removed.
			 * The copy half runs even when the delete half is declined below,
			 * so a cut over a marker still behaves as a copy.
			 */
			event.clipboardData?.setData?.(
				'text/plain',
				text.slice( start, end )
			);
			const htmlSlice = sliceValueToHTML( value, start, end );
			if ( htmlSlice ) {
				event.clipboardData?.setData?.( 'text/html', htmlSlice );
			}
			event.preventDefault();
			event.stopImmediatePropagation();
			// A selection overlapping an existing marker is declined rather
			// than nesting marks; see `refuseDeletion`. The `preventDefault`
			// above already cancelled the removal.
			if ( formatsRangeHasSuggestion( formats, start, end ) ) {
				resetRun();
				notifyEditRefused( registry );
				return;
			}
			deleteSelection( { clientId, attributeKey, start, end } );
		},
		[
			getSelectionStart,
			getSelectionEnd,
			getBlockAttributes,
			deleteSelection,
			registry,
			resetRun,
		]
	);

	useEffect( () => {
		if ( ! isSuggestMode ) {
			resetRun();
			return undefined;
		}
		const docs = getCandidateDocuments();
		const listener = ( event: any ) => onBeforeInput( event );
		const cutListener = ( event: any ) => onCut( event );
		// Capture phase so we cancel the edit before RichText/the browser apply
		// it. `selectedBlockClientId` is in the deps so the listener re-attaches
		// once the canvas iframe (and its document) has mounted.
		for ( const doc of docs ) {
			doc.addEventListener( 'beforeinput', listener, true );
			doc.addEventListener( 'cut', cutListener, true );
		}
		return () => {
			for ( const doc of docs ) {
				doc.removeEventListener( 'beforeinput', listener, true );
				doc.removeEventListener( 'cut', cutListener, true );
			}
		};
	}, [
		isSuggestMode,
		selectedBlockClientId,
		onBeforeInput,
		onCut,
		resetRun,
	] );

	return null;
}
