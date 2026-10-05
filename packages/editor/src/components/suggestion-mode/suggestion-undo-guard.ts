/**
 * Suggestion-aware undo/redo for Suggest mode.
 *
 * Undoing right after making a suggestion must withdraw the suggestion, not
 * mangle it. Two problems stand in the way:
 *
 *   1. The store interceptor can't tell an undo-induced tree change from a
 *      fresh user edit, so a plain Ctrl+Z would be re-captured as a brand-new
 *      suggestion (undoing a suggested insertion would spawn a removal note).
 *   2. Structural suggestions are compound state: the user's dispatch plus
 *      the interceptor's compensating writes plus the async note linkage,
 *      spread across undo-history transactions that can't be guaranteed to
 *      merge. Leaving them to the undo stack withdraws the suggestion
 *      piecemeal, or resurrects the marker.
 *
 * Attribute proposals need neither: the HOC writes them into the block's
 * marker as a persistent change, so Ctrl+Z pops the marker and the note
 * collector trashes the note. They are history-owned, and they stamp the
 * session's "last history-owned capture" sequence like inline markers do.
 *
 * This component wraps the core-data `undo` / `redo` actions while Suggest
 * intent is active. On undo it finds the most recent structural capture the
 * session recorded and compares it against the newest history-owned
 * capture:
 *
 *   - Newest is a structural move or insertion: the undo is consumed by
 *     withdrawing it the way Reject restores the block (remove a suggested
 *     insertion; move a suggested move back to its origin, clearing its
 *     marker), as history-ignored writes so the withdrawal can't itself be
 *     undone into a resurrected marker. `SuggestionNoteGC` observes the
 *     anchor disappearing and trashes the note. Suggested removals instead
 *     revert cleanly through the real undo stack (see HISTORY_OWNED_OPS), and
 *     while one is pending and newest the guard stands aside entirely so undo
 *     keeps running newest-first.
 *   - Otherwise (inline markers and attribute proposals live in block
 *     content and undo cleanly) it arms an "adoption token" (see
 *     suggestion-session) and lets the real undo run. The store interceptor
 *     consumes the token when the resulting block change lands and adopts it
 *     as the new baseline instead of capturing it; note cleanup again falls
 *     to `SuggestionNoteGC`.
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
 * re-open a withdrawn structural suggestion; an inline marker or attribute
 * proposal restored by redo gets its note back via `SuggestionNoteGC`.
 */
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSuggestionSession } from './suggestion-session';
import type { StructuralCapture } from './suggestion-session';
import { readSuggestionMarker } from './marker';
import { removeNoteIdFromMetadata } from '../collab-sidebar/utils';
import { STORE_NAME, EDITOR_INTENT_SUGGEST } from '../../store/constants';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/*
 * The pending marker each structural op leaves on its block. A candidate whose
 * marker is gone has already been resolved or withdrawn, so the capture
 * behind it is stale.
 */
const PENDING_MARKER_BY_OP: Record< string, string > = {
	'block-insert-after': 'pending-insert',
	'block-move': 'pending-move',
	'block-remove': 'pending-remove',
};

/*
 * Structural ops the real undo stack owns rather than the guard. Undoing a
 * suggested removal reverts cleanly through history - the transaction replaces
 * the re-inserted block wholesale, taking the marker and the async note linkage
 * with it, and leaving the history item unconsumed keeps a follow-up undo
 * stepping into older changes. Moves and insertions leave the block alive
 * across the transaction, where the history-ignored linkage write resurrects
 * the marker, so the guard withdraws those itself.
 *
 * These still take part in the newest-first ordering below: a pending removal
 * that is newer than every withdrawable suggestion has to reach undo first, or
 * an older suggestion jumps the queue and the stack stops matching the order
 * the user worked in.
 */
const HISTORY_OWNED_OPS = new Set( [ 'block-remove' ] );

/**
 * Find the newest structural suggestion the session captured: the capture
 * with the highest sequence whose pending marker is still live on the block.
 *
 * The `kind` says who reverts it. `structural` is withdrawn by the guard;
 * `history` means the newest suggestion belongs to the real undo stack, so
 * the guard must stand aside rather than reach past it for an older one it
 * could withdraw.
 *
 * @param captures    Structural captures keyed by clientId.
 * @param blockEditor Block-editor selectors; without them (unit tests,
 *                    standalone) every candidate is skipped.
 * @return Newest pending suggestion, or null.
 */
export function findNewestPendingSuggestion(
	captures: ReadonlyMap< string, StructuralCapture > | null | undefined,
	blockEditor: any
): {
	kind: 'structural' | 'history';
	clientId: string;
	capture: StructuralCapture;
	seq: number;
} | null {
	let newest: {
		kind: 'structural' | 'history';
		clientId: string;
		capture: StructuralCapture;
		seq: number;
	} | null = null;
	for ( const [ clientId, capture ] of captures ?? [] ) {
		const pendingType = PENDING_MARKER_BY_OP[ capture.op.type ];
		if ( ! pendingType || ( newest && capture.seq <= newest.seq ) ) {
			continue;
		}
		const markerType = readSuggestionMarker(
			blockEditor?.getBlockAttributes?.( clientId )
		)?.type;
		if ( markerType === pendingType ) {
			newest = {
				kind: HISTORY_OWNED_OPS.has( capture.op.type )
					? 'history'
					: 'structural',
				clientId,
				capture,
				seq: capture.seq,
			};
		}
	}
	return newest;
}

/**
 * Build the attribute update that strips a withdrawn structural suggestion's
 * bookkeeping from a block: the `metadata.suggestion` marker and, when the
 * note already exists, its `metadata.noteId` linkage.
 *
 * @param currentAttributes Block's current attributes.
 * @param commentId         Linked note id, if any.
 * @return Update payload for `updateBlockAttributes`, or null when there is
 * nothing to strip.
 */
function withdrawnMarkerAttributes(
	currentAttributes: any,
	commentId: number | string | null
) {
	const meta = currentAttributes?.metadata;
	if ( ! meta || meta.suggestion === undefined ) {
		return null;
	}
	const { suggestion: _drop, ...rest } = meta;
	const metadata = commentId
		? removeNoteIdFromMetadata( rest, commentId as any )
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
		getStructuralCaptures,
		clearStructuralCapture,
		requestInterceptorBypass,
		getLastContentCaptureSeq,
		armUndoRedoAdoption,
	} = useSuggestionSession();
	const registry = useRegistry();

	const isSuggestMode = useSelect(
		( select ) =>
			// `getEditorIntent` is private while Suggest mode is experimental.
			unlock( select( STORE_NAME ) ).getEditorIntent() ===
			EDITOR_INTENT_SUGGEST,
		[]
	);

	// Read from inside the wrapped dispatch, which outlives any single render.
	const clearStructuralCaptureRef = useRef( clearStructuralCapture );
	clearStructuralCaptureRef.current = clearStructuralCapture;

	const requestInterceptorBypassRef = useRef( requestInterceptorBypass );
	requestInterceptorBypassRef.current = requestInterceptorBypass;

	/*
	 * Tell the Undo button when there is a suggestion to withdraw. A
	 * structural capture's compensating writes are history-ignored, so
	 * without this the button can stay inert and never reach the wrapped
	 * `undo` below. A `history` candidate is left to the real stack, which
	 * already reports it. Captures live in a ref; every capture comes with a
	 * marker write to the block-editor store, which is what re-runs this.
	 */
	const hasWithdrawableSuggestion = useSelect(
		( select ) => {
			if ( ! isSuggestMode ) {
				return false;
			}
			const newest = findNewestPendingSuggestion(
				getStructuralCaptures(),
				select( blockEditorStore )
			);
			return !! newest && newest.kind !== 'history';
		},
		[ isSuggestMode, getStructuralCaptures ]
	);
	const { setHasSuggestionUndo } = unlock( useDispatch( editorStore ) );
	useEffect( () => {
		setHasSuggestionUndo( hasWithdrawableSuggestion );
	}, [ hasWithdrawableSuggestion, setHasSuggestionUndo ] );
	useEffect(
		() => () => setHasSuggestionUndo( false ),
		[ setHasSuggestionUndo ]
	);

	useEffect( () => {
		if ( ! isSuggestMode ) {
			return undefined;
		}

		const coreActions = registry.dispatch( coreStore );
		if ( ! coreActions?.undo || ! coreActions?.redo ) {
			return undefined;
		}

		/*
		 * Withdraw a structural suggestion the way Reject restores the block.
		 * The writes are marked `history: 'ignore'`: the withdrawal resolves
		 * a suggestion, it is not an edit — recording it would let a later
		 * undo/redo resurrect a marker whose note is gone. The shapes below
		 * are exactly the reject-landing shapes the store interceptor already
		 * recognizes, so nothing is re-captured.
		 */
		const withdrawStructuralSuggestion = (
			clientId: string,
			capture: StructuralCapture
		) => {
			const blockEditor = registry.select( blockEditorStore );
			const {
				removeBlock,
				moveBlockToPosition,
				updateBlockAttributes,
				__unstableMarkNextChangeAsNotPersistent: markIgnored,
			} = registry.dispatch( blockEditorStore );
			const op = capture.op;
			const attributes = blockEditor.getBlockAttributes( clientId );
			const clearAttrs = withdrawnMarkerAttributes(
				attributes,
				readSuggestionMarker( attributes )?.commentId ?? null
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
			clearStructuralCaptureRef.current( clientId );
		};

		/*
		 * Consume the undo when the most recent capture is a structural one
		 * newer than the last history-owned capture; inline markers and
		 * attribute proposals live in block content and are correctly
		 * reverted by the real undo stack.
		 *
		 * @return {boolean} True when the undo was consumed.
		 */
		const withdrawNewestSuggestion = () => {
			const newest = findNewestPendingSuggestion(
				getStructuralCaptures(),
				registry.select( blockEditorStore )
			);
			/*
			 * `history` kind: the newest suggestion is one the real undo stack
			 * reverts. Standing aside is what keeps undo newest-first - reaching
			 * past it for an older withdrawable suggestion would unwind the
			 * user's actions out of order.
			 */
			if (
				! newest ||
				newest.kind === 'history' ||
				newest.seq <= getLastContentCaptureSeq()
			) {
				return false;
			}
			withdrawStructuralSuggestion( newest.clientId, newest.capture );
			return true;
		};

		const originalUndo = coreActions.undo;
		const originalRedo = coreActions.redo;

		/*
		 * Arm an adoption only when there is a history record to land: an
		 * undo or redo with nothing to replay changes no block, so the token
		 * would wait for the next real edit and let it skip capture.
		 */
		const coreSelect = registry.select( coreStore );

		coreActions.undo = ( ...args ) => {
			if ( withdrawNewestSuggestion() ) {
				return Promise.resolve();
			}
			if ( coreSelect.hasUndo?.() ?? true ) {
				armUndoRedoAdoption();
			}
			return originalUndo( ...args );
		};

		coreActions.redo = ( ...args ) => {
			if ( coreSelect.hasRedo?.() ?? true ) {
				armUndoRedoAdoption();
			}
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
		getStructuralCaptures,
		armUndoRedoAdoption,
	] );

	return null;
}
