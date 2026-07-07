/**
 * Suggestion-aware undo/redo for Suggest mode.
 *
 * Undoing right after making a suggestion must withdraw the suggestion —
 * not mangle it. Three problems stand in the way:
 *
 *   1. The store interceptor can't tell an undo-induced tree change from a
 *      fresh user edit, so a plain Ctrl+Z would be re-captured as a brand-new
 *      suggestion (undoing a typed addition would spawn an attribute-set
 *      note; undoing a suggested insertion would spawn a removal note).
 *   2. Attribute suggestions never touch the undo stack at all: the proposed
 *      value lives in the suggestion overlay while the real store sits at
 *      baseline, so core undo has nothing to revert.
 *   3. Structural suggestions are compound state: the user's dispatch plus
 *      the interceptor's compensating writes plus the async note linkage,
 *      spread across undo-history transactions that can't be guaranteed to
 *      merge (the linkage lands after the auto-save debounce, well past any
 *      history coalescing window). Leaving them to the undo stack withdraws
 *      the suggestion piecemeal — or resurrects the marker.
 *
 * This component wraps the core-data `undo` / `redo` actions while Suggest
 * intent is active. On undo it finds the most recently captured pending
 * suggestion held by the overlay and compares it against the newest inline
 * (marker) capture:
 *
 *   - Newest is an attribute suggestion → the undo is consumed by reverting
 *     that overlay entry back to its baseline. The auto-saver then observes
 *     an empty operation set and trashes the linked note.
 *   - Newest is a structural move or insertion → the undo is consumed by
 *     withdrawing it the way Reject restores the block (remove a suggested
 *     insertion; move a suggested move back to its origin, clearing its
 *     marker), as history-ignored writes so the withdrawal can't itself be
 *     undone into a resurrected marker. `SuggestionNoteGC` observes the
 *     anchor disappearing and trashes the note. Suggested removals instead
 *     revert cleanly through the real undo stack (see PENDING_MARKER_BY_OP).
 *   - Otherwise (inline text/format markers live in block content and undo
 *     cleanly) it arms an "adoption token" (see overlay-context) and lets
 *     the real undo run. The store interceptor consumes the token when the
 *     resulting block change lands and adopts it as the new baseline instead
 *     of capturing it; note cleanup again falls to `SuggestionNoteGC`.
 *
 * The wrap targets `registry.dispatch( coreStore )`: the `core/editor` undo
 * and redo actions are thunks that resolve `dispatch( coreStore ).undo()` at
 * call time, so patching the core-data actions object intercepts the toolbar
 * button, the keyboard shortcut, and programmatic callers alike. Originals
 * are restored when Suggest intent deactivates.
 *
 * Known limitation: a swallowed undo doesn't consume the underlying history
 * item of the original structural dispatch; a follow-up Ctrl+Z replays that
 * item, which is a no-op against the already-withdrawn state. Redo cannot
 * re-open a withdrawn attribute or structural suggestion; an inline marker
 * restored by redo gets its note back via `SuggestionNoteGC`.
 */

/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { operationsFromOverlay } from './provider';
import { removeNoteIdFromMetadata } from '../collab-sidebar/utils';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';
import { unlock } from '../../lock-unlock';

/*
 * Structural ops the guard withdraws itself. `block-remove` is deliberately
 * absent: undoing a suggested removal reverts cleanly through the real undo
 * stack — the history transaction replaces the re-inserted block wholesale,
 * taking the marker and the async note linkage with it, and consuming the
 * history item keeps a follow-up undo stepping into older changes. Moves and
 * insertions leave the block alive across the transaction, where the
 * history-ignored linkage write resurrects the marker — those are withdrawn
 * here instead.
 */
const PENDING_MARKER_BY_OP = {
	'block-insert-after': 'pending-insert',
	'block-move': 'pending-move',
};

/**
 * Find the pending suggestion the guard should withdraw on undo: the overlay
 * entry (attribute edit or structural op) with the highest capture sequence.
 * Attribute candidates need a pending baseline-vs-overlay diff; structural
 * candidates need their pending marker still live on the block (an already
 * resolved or withdrawn op is stale overlay state, not a candidate).
 *
 * @param {Object}      entries     Overlay entries keyed by clientId.
 * @param {Object|null} blockEditor Block-editor selectors; without them (unit
 *                                  tests, standalone) structural candidates
 *                                  are skipped.
 * @return {{kind: 'attribute'|'structural', clientId: string, entry: Object,
 * seq: number}|null} Newest withdrawable suggestion.
 */
export function findNewestWithdrawableSuggestion( entries, blockEditor ) {
	let newest = null;
	for ( const [ clientId, entry ] of Object.entries( entries ?? {} ) ) {
		if (
			entry.lastEditSeq &&
			( ! newest || entry.lastEditSeq > newest.seq )
		) {
			const operations = operationsFromOverlay(
				entry.baselineAttributes,
				entry.overlayAttributes
			);
			if ( operations.length > 0 ) {
				newest = {
					kind: 'attribute',
					clientId,
					entry,
					seq: entry.lastEditSeq,
				};
			}
		}
		if (
			entry.structuralOp &&
			entry.structuralOpSeq &&
			PENDING_MARKER_BY_OP[ entry.structuralOp.type ] &&
			( ! newest || entry.structuralOpSeq > newest.seq )
		) {
			const markerType =
				blockEditor?.getBlockAttributes?.( clientId )?.metadata
					?.suggestion?.type;
			if (
				markerType === PENDING_MARKER_BY_OP[ entry.structuralOp.type ]
			) {
				newest = {
					kind: 'structural',
					clientId,
					entry,
					seq: entry.structuralOpSeq,
				};
			}
		}
	}
	return newest;
}

/**
 * Build the attribute update that strips a withdrawn structural suggestion's
 * bookkeeping from a block: the `metadata.suggestion` marker and, when the
 * note already exists, its `metadata.noteId` linkage.
 *
 * @param {Object}             currentAttributes Block's current attributes.
 * @param {number|string|null} commentId         Linked note id, if any.
 * @return {Object|null} Update payload for `updateBlockAttributes`, or null
 * when there is nothing to strip.
 */
function withdrawnMarkerAttributes( currentAttributes, commentId ) {
	const meta = currentAttributes?.metadata;
	if ( ! meta || meta.suggestion === undefined ) {
		return null;
	}
	const { suggestion: _drop, ...rest } = meta;
	const metadata = commentId
		? removeNoteIdFromMetadata( rest, commentId )
		: rest;
	return { metadata };
}

/**
 * Invisible component that makes undo and redo suggestion-aware while the
 * editor is in Suggest intent.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionUndoGuard() {
	const {
		entries,
		setOverlayAttributes,
		clearOverlay,
		requestInterceptorBypass,
		getLastContentCaptureSeq,
		armUndoRedoAdoption,
	} = useSuggestionOverlay();
	const registry = useRegistry();

	const isSuggestMode = useSelect(
		( select ) =>
			// `getEditorIntent` is private while Suggest mode is experimental.
			unlock( select( EDITOR_STORE_NAME ) ).getEditorIntent() ===
			SUGGEST_INTENT,
		[]
	);

	// Read from inside the wrapped dispatch, which outlives any single render.
	const entriesRef = useRef( entries );
	entriesRef.current = entries;

	const setOverlayAttributesRef = useRef( setOverlayAttributes );
	setOverlayAttributesRef.current = setOverlayAttributes;

	const clearOverlayRef = useRef( clearOverlay );
	clearOverlayRef.current = clearOverlay;

	const requestInterceptorBypassRef = useRef( requestInterceptorBypass );
	requestInterceptorBypassRef.current = requestInterceptorBypass;

	useEffect( () => {
		if ( ! isSuggestMode ) {
			return undefined;
		}

		const coreActions = registry.dispatch( coreStore );
		if ( ! coreActions?.undo || ! coreActions?.redo ) {
			return undefined;
		}

		/*
		 * Revert the entry to its baseline (rather than clearing it): the
		 * auto-saver's own lifecycle then observes an empty operation set for
		 * the entry and trashes the linked note, correctly serialized behind
		 * any in-flight create for the same block.
		 */
		const cancelAttributeSuggestion = ( clientId, entry ) => {
			const revert = {};
			for ( const key of Object.keys( entry.overlayAttributes ) ) {
				revert[ key ] = entry.baselineAttributes?.[ key ];
			}
			setOverlayAttributesRef.current( clientId, revert );
		};

		/*
		 * Withdraw a structural suggestion the way Reject restores the block.
		 * The writes are marked `history: 'ignore'`: the withdrawal resolves
		 * a suggestion, it is not an edit — recording it would let a later
		 * undo/redo resurrect a marker whose note is gone. The shapes below
		 * are exactly the reject-landing shapes the store interceptor already
		 * recognizes, so nothing is re-captured.
		 */
		const withdrawStructuralSuggestion = ( clientId, entry ) => {
			const blockEditor = registry.select( blockEditorStore );
			const {
				removeBlock,
				moveBlockToPosition,
				updateBlockAttributes,
				__unstableMarkNextChangeAsNotPersistent: markIgnored,
			} = registry.dispatch( blockEditorStore );
			const op = entry.structuralOp;
			const clearAttrs = withdrawnMarkerAttributes(
				blockEditor.getBlockAttributes( clientId ),
				entry.commentId
			);

			requestInterceptorBypassRef.current( clientId );
			if ( op.type === 'block-insert-after' ) {
				markIgnored( { history: 'ignore' } );
				removeBlock( clientId, false );
			} else if ( op.type === 'block-move' ) {
				// Marker-clear and restoring move batched into one store
				// update — the reject-landing shape the interceptor adopts
				// instead of re-capturing (see rejectSuggestion).
				registry.batch( () => {
					if ( clearAttrs ) {
						markIgnored( { history: 'ignore' } );
						updateBlockAttributes( clientId, clearAttrs );
					}
					markIgnored( { history: 'ignore' } );
					moveBlockToPosition(
						clientId,
						blockEditor.getBlockRootClientId( clientId ) ?? '',
						op.fromParentClientId ?? '',
						op.fromIndex ?? 0
					);
				} );
			}
			clearOverlayRef.current( clientId );
		};

		/*
		 * Consume the undo when the most recent capture is an overlay-held
		 * suggestion newer than the last inline (marker) capture; inline
		 * markers live in block content and are correctly reverted by the
		 * real undo stack.
		 *
		 * @return {boolean} True when the undo was consumed.
		 */
		const withdrawNewestSuggestion = () => {
			const newest = findNewestWithdrawableSuggestion(
				entriesRef.current,
				registry.select( blockEditorStore )
			);
			if ( ! newest || newest.seq <= getLastContentCaptureSeq() ) {
				return false;
			}
			if ( newest.kind === 'structural' ) {
				withdrawStructuralSuggestion( newest.clientId, newest.entry );
			} else {
				cancelAttributeSuggestion( newest.clientId, newest.entry );
			}
			return true;
		};

		const originalUndo = coreActions.undo;
		const originalRedo = coreActions.redo;

		coreActions.undo = ( ...args ) => {
			if ( withdrawNewestSuggestion() ) {
				return Promise.resolve();
			}
			armUndoRedoAdoption();
			return originalUndo( ...args );
		};

		coreActions.redo = ( ...args ) => {
			armUndoRedoAdoption();
			return originalRedo( ...args );
		};

		return () => {
			coreActions.undo = originalUndo;
			coreActions.redo = originalRedo;
		};
	}, [
		isSuggestMode,
		registry,
		getLastContentCaptureSeq,
		armUndoRedoAdoption,
	] );

	return null;
}
