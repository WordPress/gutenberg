/**
 * In-memory overlay system for Suggest mode.
 *
 * The overlay holds user edits made while the editor is in `suggest` intent
 * without ever writing them through to the block-editor store. Each entry is
 * keyed by `clientId` and carries:
 *   - `baselineAttributes` — captured on first edit, used by
 *     `operationsFromOverlay` (provider.js) to build the persisted suggestion.
 *   - `overlayAttributes`  — pending user changes; merged into the rendered
 *     attributes by `withSuggestionOverlay` so the user sees their edit, but
 *     never stored.
 *
 * Why an overlay rather than a draft post / branch?
 *   - The post stays at its real baseline so autosave, undo/redo, and
 *     real-time collaboration sync see only persisted state.
 *   - Multiple editors can suggest concurrently without conflicting writes.
 *   - Suggestions stay immutable until explicitly committed (`createSuggestion`),
 *     so a half-typed edit never leaks into the post.
 *
 * Overlay entry lifecycle:
 *   1. `captureBaseline` — fired on first `setAttributes` (HOC) or on the first
 *      detected store-level mutation (store-interceptor).
 *   2. `setOverlayAttributes` — accumulated by the wrapped `setAttributes` or
 *      by interceptor diffs.
 *   3. `clearOverlay` / `PRUNE_ORPHANS` — entries are dropped when the
 *      suggestion is committed, rejected, or the underlying block is deleted.
 *
 * The orphan prune runs whenever the live block tree shrinks; it skips when
 * the block-editor store isn't registered (tests, standalone consumers).
 */
import type { ReactNode } from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useReducer,
	useRef,
} from '@wordpress/element';
import { useRegistry, useSelect } from '@wordpress/data';
import { createSuggestionWriteQueue } from './suggestion-write-queue';
import type { SuggestionWriteQueue } from './suggestion-write-queue';

// Referenced by name to keep the provider runnable in tests and standalone
// contexts where the block-editor store isn't registered. Orphan cleanup is
// skipped in those environments.
const BLOCK_EDITOR_STORE_NAME = 'core/block-editor';

/*
 * Monotonic sequence shared by every capture path so the undo guard can order
 * an overlay-held attribute suggestion against marker/structural captures
 * (which live on the real undo stack). Module-scoped: the ordering only needs
 * to be consistent within a session, not persisted.
 */
let captureSequence = 0;
const nextCaptureSeq = () => ++captureSequence;

/*
 * How long an armed undo/redo adoption token stays valid. The token is armed
 * synchronously when undo/redo dispatches, but the block-editor tree only
 * reflects the entity change after React re-renders and the block-sync effect
 * runs — an async gap the interceptor can't observe directly. The expiry
 * bounds the window so a stale token (an undo that ended up changing nothing
 * block-related) can't swallow a later genuine edit.
 */
const UNDO_ADOPTION_TTL_MS = 1000;

/**
 * A persisted suggestion operation. Attribute ops are derived from the
 * baseline-vs-overlay diff; structural ops (block-remove, block-insert-after,
 * block-move) are pre-built by the store interceptor. The concrete shape
 * varies per op type, so the contract stays open beyond `type`.
 */
export interface SuggestionOperation {
	type: string;
	[ key: string ]: any;
}

export interface OverlayEntry {
	/** The block name at the time the overlay was opened. */
	blockName: string;
	/**
	 * The attributes captured when Suggest mode first began editing this
	 * block.
	 */
	baselineAttributes: Record< string, any >;
	/** Pending attribute changes that have not yet been committed. */
	overlayAttributes: Record< string, any >;
	/** Note comment id the entry is synced to, when one exists. */
	commentId: number | null;
	/** Fingerprint of the operations last persisted for this entry. */
	syncedOpsKey: string | null;
	/** Capture-order stamp of the most recent attribute edit. */
	lastEditSeq?: number;
	/** Pending structural operation, when one was captured. */
	structuralOp?: SuggestionOperation;
	/** Capture-order stamp of the structural operation. */
	structuralOpSeq?: number;
}

export type OverlayEntries = Record< string, OverlayEntry >;

/**
 * Handler invoked with a format/content suggestion request. Returning
 * `false` means the handler cannot process the request and the edit must
 * fall through to the overlay path; anything else counts as accepted.
 */
type SuggestionRequestHandler = ( request: any ) => unknown;

/**
 * A block can hold more than one pending suggestion at a time — an
 * attribute-set overlay (heading level) alongside inline markers in the same
 * block's content, which is a legitimate combination because the two describe
 * disjoint parts of the block. The overlay entry belongs to whichever
 * suggestion opened it, so a decision on one of the block's other suggestions
 * must leave it alone. `clearOverlayForComment` is the guarded clear used by
 * those paths: it removes the entry only when the entry is the one linked to
 * the comment being resolved. See finding F-14 in the Suggest mode testing
 * document.
 */

export interface OverlayContextValue {
	entries: OverlayEntries;
	captureBaseline: (
		clientId: string,
		blockName: string,
		attributes: Record< string, any >
	) => void;
	setOverlayAttributes: (
		clientId: string,
		attributes: Record< string, any >
	) => void;
	clearOverlay: ( clientId: string ) => void;
	clearOverlayForComment: (
		clientId: string,
		commentId: number | string | null | undefined
	) => void;
	setCommentId: ( clientId: string, commentId: number | null ) => void;
	setSyncedOpsKey: ( clientId: string, syncedOpsKey: string | null ) => void;
	setStructuralOp: (
		clientId: string,
		blockName: string,
		op: SuggestionOperation
	) => void;
	hasOverlay: ( clientId: string ) => boolean;
	requestInterceptorBypass: ( clientId: string ) => void;
	consumeInterceptorBypass: ( clientId: string ) => boolean;
	registerFormatHandler: ( handler: SuggestionRequestHandler ) => () => void;
	requestFormatSuggestion: ( request: any ) => boolean;
	registerContentHandler: ( handler: SuggestionRequestHandler ) => () => void;
	requestContentSuggestion: ( request: any ) => boolean;
	enqueueSuggestionWrite: (
		clientId: string,
		task: () => unknown
	) => Promise< unknown >;
	markDeferredInsertion: ( clientId: string ) => void;
	unmarkDeferredInsertion: ( clientId: string ) => void;
	isDeferredInsertion: ( clientId: string ) => boolean;
	clearDeferredInsertions: () => void;
	getLastContentCaptureSeq: () => number;
	armUndoRedoAdoption: () => void;
	consumeUndoRedoAdoption: () => boolean;
}

type OverlayAction =
	| {
			type: 'CAPTURE_BASELINE';
			clientId: string;
			blockName: string;
			attributes: Record< string, any >;
	  }
	| {
			type: 'SET_OVERLAY_ATTRIBUTES';
			clientId: string;
			attributes: Record< string, any >;
			seq?: number;
	  }
	| { type: 'CLEAR_OVERLAY'; clientId: string }
	| {
			type: 'CLEAR_OVERLAY_FOR_COMMENT';
			clientId: string;
			commentId: number | string | null | undefined;
	  }
	| {
			type: 'SET_COMMENT_ID';
			clientId: string;
			commentId: number | null;
	  }
	| {
			type: 'SET_SYNCED_OPS_KEY';
			clientId: string;
			syncedOpsKey: string | null;
	  }
	| {
			type: 'SET_STRUCTURAL_OP';
			clientId: string;
			blockName: string;
			op: SuggestionOperation;
			seq?: number;
	  }
	| {
			type: 'PRUNE_ORPHANS';
			liveClientIds: string[] | Set< string >;
	  };

const EMPTY_ENTRIES: OverlayEntries = Object.freeze( {} );

const OverlayContext = createContext< OverlayContextValue >( {
	entries: EMPTY_ENTRIES,
	captureBaseline: () => {},
	setOverlayAttributes: () => {},
	clearOverlay: () => {},
	clearOverlayForComment: () => {},
	setCommentId: () => {},
	setSyncedOpsKey: () => {},
	setStructuralOp: () => {},
	hasOverlay: () => false,
	requestInterceptorBypass: () => {},
	consumeInterceptorBypass: () => false,
	registerFormatHandler: () => () => {},
	requestFormatSuggestion: () => false,
	registerContentHandler: () => () => {},
	requestContentSuggestion: () => false,
	// Standalone default (no provider mounted): run the task immediately.
	enqueueSuggestionWrite: ( _clientId, task ) => Promise.resolve( task() ),
	markDeferredInsertion: () => {},
	unmarkDeferredInsertion: () => {},
	isDeferredInsertion: () => false,
	clearDeferredInsertions: () => {},
	getLastContentCaptureSeq: () => 0,
	armUndoRedoAdoption: () => {},
	consumeUndoRedoAdoption: () => false,
} );

/**
 * Reducer managing the map of pending block overlays.
 *
 * @param state  Current state.
 * @param action Action.
 * @return Next state.
 */
export function overlayReducer(
	state: OverlayEntries,
	action: OverlayAction
): OverlayEntries {
	switch ( action.type ) {
		case 'CAPTURE_BASELINE': {
			if ( state[ action.clientId ] ) {
				return state;
			}
			return {
				...state,
				[ action.clientId ]: {
					blockName: action.blockName,
					baselineAttributes: action.attributes,
					overlayAttributes: {},
					commentId: null,
					syncedOpsKey: null,
				},
			};
		}
		case 'SET_OVERLAY_ATTRIBUTES': {
			const entry = state[ action.clientId ];
			if ( ! entry ) {
				return state;
			}
			return {
				...state,
				[ action.clientId ]: {
					...entry,
					overlayAttributes: {
						...entry.overlayAttributes,
						...action.attributes,
					},
					// Capture-order stamp read by the undo guard to find the
					// most recently edited attribute suggestion. Kept from
					// the previous state when the action carries no sequence
					// (e.g. reducer unit tests).
					lastEditSeq: action.seq ?? entry.lastEditSeq,
				},
			};
		}
		case 'CLEAR_OVERLAY': {
			if ( ! state[ action.clientId ] ) {
				return state;
			}
			const { [ action.clientId ]: _removed, ...rest } = state;
			return rest;
		}
		case 'CLEAR_OVERLAY_FOR_COMMENT': {
			/*
			 * Guarded clear for decision paths that act on a suggestion which
			 * does not live in the overlay (an inline marker). The block may
			 * still hold an unrelated pending attribute suggestion, and that
			 * entry is the only anchor keeping its note alive — dropping it
			 * would send the note to the garbage collector and take the
			 * proposed value off the canvas with it.
			 */
			const entry = state[ action.clientId ];
			if ( entry?.commentId === null || entry?.commentId === undefined ) {
				return state;
			}
			if ( String( entry.commentId ) !== String( action.commentId ) ) {
				return state;
			}
			const { [ action.clientId ]: _dropped, ...remaining } = state;
			return remaining;
		}
		case 'SET_COMMENT_ID': {
			const entry = state[ action.clientId ];
			if ( ! entry ) {
				return state;
			}
			return {
				...state,
				[ action.clientId ]: {
					...entry,
					commentId: action.commentId,
				},
			};
		}
		case 'SET_SYNCED_OPS_KEY': {
			const entry = state[ action.clientId ];
			if ( ! entry ) {
				return state;
			}
			return {
				...state,
				[ action.clientId ]: {
					...entry,
					syncedOpsKey: action.syncedOpsKey,
				},
			};
		}
		case 'SET_STRUCTURAL_OP': {
			// Structural ops (block-remove, block-insert-after, block-move)
			// don't have a baseline-vs-overlay attribute diff; the operation
			// itself describes the change. Auto-save reads `structuralOp`
			// straight through. Replaces any existing op for the same block
			// — only one structural marker can be pending at a time.
			const existing = state[ action.clientId ];
			return {
				...state,
				[ action.clientId ]: {
					blockName: action.blockName,
					baselineAttributes: existing?.baselineAttributes ?? {},
					overlayAttributes: existing?.overlayAttributes ?? {},
					commentId: existing?.commentId ?? null,
					syncedOpsKey: existing?.syncedOpsKey ?? null,
					lastEditSeq: existing?.lastEditSeq,
					structuralOp: action.op,
					// Capture-order stamp read by the undo guard to find the
					// most recently captured structural suggestion.
					structuralOpSeq: action.seq ?? existing?.structuralOpSeq,
				},
			};
		}
		case 'PRUNE_ORPHANS': {
			// Action carries a serializable array; the reducer materializes a
			// Set internally for the lookup. Keeps actions Redux-DevTools-
			// friendly (Sets aren't serializable for time-travel).
			const liveIds = Array.isArray( action.liveClientIds )
				? new Set( action.liveClientIds )
				: action.liveClientIds;
			const keys = Object.keys( state );
			let changed = false;
			const next: OverlayEntries = {};
			for ( const key of keys ) {
				if ( liveIds.has( key ) ) {
					next[ key ] = state[ key ];
				} else {
					changed = true;
				}
			}
			return changed ? next : state;
		}
		default:
			return state;
	}
}

/**
 * Provider exposing the suggestion overlay to descendant blocks.
 *
 * The overlay is intentionally in-memory only. It stores pending attribute
 * changes per `clientId` so a block can render the user's in-progress
 * suggestion without mutating the real block-editor state.
 *
 */
export function SuggestionOverlayProvider( {
	children,
}: {
	children: ReactNode;
} ) {
	const [ entries, dispatch ] = useReducer( overlayReducer, EMPTY_ENTRIES );
	const registry = useRegistry();

	const captureBaseline = useCallback(
		(
			clientId: string,
			blockName: string,
			attributes: Record< string, any >
		) =>
			dispatch( {
				type: 'CAPTURE_BASELINE',
				clientId,
				blockName,
				attributes,
			} ),
		[]
	);

	const setOverlayAttributes = useCallback(
		( clientId: string, attributes: Record< string, any > ) =>
			dispatch( {
				type: 'SET_OVERLAY_ATTRIBUTES',
				clientId,
				attributes,
				seq: nextCaptureSeq(),
			} ),
		[]
	);

	const clearOverlay = useCallback(
		( clientId: string ) => dispatch( { type: 'CLEAR_OVERLAY', clientId } ),
		[]
	);

	const clearOverlayForComment = useCallback(
		( clientId: string, commentId: number | string | null | undefined ) =>
			dispatch( {
				type: 'CLEAR_OVERLAY_FOR_COMMENT',
				clientId,
				commentId,
			} ),
		[]
	);

	const setCommentId = useCallback(
		( clientId: string, commentId: number | null ) =>
			dispatch( { type: 'SET_COMMENT_ID', clientId, commentId } ),
		[]
	);

	const setSyncedOpsKey = useCallback(
		( clientId: string, syncedOpsKey: string | null ) =>
			dispatch( { type: 'SET_SYNCED_OPS_KEY', clientId, syncedOpsKey } ),
		[]
	);

	/*
	 * Sequence stamp of the most recent capture that lives on the real undo
	 * stack (an inline marker write or a structural marker). The undo guard
	 * compares it against overlay entries' `lastEditSeq` to decide whether
	 * Ctrl+Z should cancel a pending attribute suggestion or perform a normal
	 * undo. A ref because it is written from `registry.subscribe` and event
	 * handlers, and read synchronously inside the wrapped undo dispatch.
	 */
	const lastContentCaptureSeqRef = useRef( 0 );

	const getLastContentCaptureSeq = useCallback(
		() => lastContentCaptureSeqRef.current,
		[]
	);

	const setStructuralOp = useCallback(
		( clientId: string, blockName: string, op: SuggestionOperation ) => {
			dispatch( {
				type: 'SET_STRUCTURAL_OP',
				clientId,
				blockName,
				op,
				seq: nextCaptureSeq(),
			} );
		},
		[]
	);

	const hasEntries = Object.keys( entries ).length > 0;

	const hasOverlay = useCallback(
		( clientId: string ) => {
			const entry = entries[ clientId ];
			return (
				!! entry && Object.keys( entry.overlayAttributes ).length > 0
			);
		},
		[ entries ]
	);

	// Tracks clientIds whose next block-attribute mutation should bypass the
	// store interceptor. The accept-suggestion flow uses this to land applied
	// attributes on the live block — without it, the interceptor would treat
	// the apply as just another user edit and revert it into the overlay.
	// A ref-set rather than reducer state because the value is consumed
	// inside `registry.subscribe` (which doesn't react to React state) and
	// must clear synchronously when the dispatch is processed.
	const bypassClientIdsRef = useRef( new Set< string >() );

	const requestInterceptorBypass = useCallback( ( clientId: string ) => {
		if ( clientId ) {
			bypassClientIdsRef.current.add( clientId );
			/*
			 * Every inline marker write (addition/deletion/format keyboards,
			 * content reconciler) requests a bypass first, so this doubles as
			 * the "an inline capture happened" stamp for the undo guard.
			 * Apply/reject flows bump it too, which is harmless — ordering
			 * only matters relative to pending attribute and structural
			 * captures still held by the overlay.
			 */
			lastContentCaptureSeqRef.current = nextCaptureSeq();
		}
	}, [] );

	const consumeInterceptorBypass = useCallback( ( clientId: string ) => {
		const set = bypassClientIdsRef.current;
		if ( ! set.has( clientId ) ) {
			return false;
		}
		set.delete( clientId );
		return true;
	}, [] );

	// Single slot for the format-suggestion handler. The per-block overlay HOC
	// only *detects* a formatting-only edit (cheap, no store access); the
	// actual note creation + marker write lives in one mounted component
	// (`SuggestionFormatKeyboard`) that registers its handler here. Keeping the
	// heavy `useSuggestionsProvider` out of every block's render is why this is
	// a singleton rather than a per-block hook. A ref (not state) so
	// registering doesn't re-render every subscribed block.
	const formatHandlerRef = useRef< SuggestionRequestHandler | null >( null );

	const registerFormatHandler = useCallback(
		( handler: SuggestionRequestHandler ) => {
			formatHandlerRef.current = handler;
			return () => {
				if ( formatHandlerRef.current === handler ) {
					formatHandlerRef.current = null;
				}
			};
		},
		[]
	);

	const requestFormatSuggestion = useCallback( ( request: any ) => {
		const handler = formatHandlerRef.current;
		if ( ! handler ) {
			return false;
		}
		/*
		 * The handler returns a synchronous verdict: `false` means it cannot
		 * process this request, and the caller must let the edit fall through
		 * to the overlay path rather than swallow it. Anything else —
		 * including a promise from an async handler — counts as accepted.
		 */
		return handler( request ) !== false;
	}, [] );

	// Single slot for the content-reconciliation handler, the twin of the format
	// handler above for text edits that reach the block as a whole new `content`
	// value rather than a `beforeinput` the keyboards intercept (a committed IME
	// composition, autocorrect, a drag-drop, a multi-line paste). The per-block
	// HOC runs the cheap diff and hands a ready marker plan here; this single
	// mounted component owns note creation and the marker write.
	const contentHandlerRef = useRef< SuggestionRequestHandler | null >( null );

	const registerContentHandler = useCallback(
		( handler: SuggestionRequestHandler ) => {
			contentHandlerRef.current = handler;
			return () => {
				if ( contentHandlerRef.current === handler ) {
					contentHandlerRef.current = null;
				}
			};
		},
		[]
	);

	const requestContentSuggestion = useCallback( ( request: any ) => {
		const handler = contentHandlerRef.current;
		if ( ! handler ) {
			return false;
		}
		// Same synchronous-verdict contract as `requestFormatSuggestion`.
		return handler( request ) !== false;
	}, [] );

	/*
	 * One write queue per editor, shared by the content reconciler and the
	 * format keyboard so their note-then-marker flights serialize per block
	 * instead of interleaving (each component keeping its own in-flight guard
	 * previously let one of each race on the same block). A ref because the
	 * queue is imperative state consumed outside React's render cycle.
	 */
	const writeQueueRef = useRef< SuggestionWriteQueue | null >( null );
	if ( writeQueueRef.current === null ) {
		writeQueueRef.current = createSuggestionWriteQueue();
	}
	const enqueueSuggestionWrite = useCallback(
		( clientId: string, task: () => unknown ) =>
			writeQueueRef.current!.enqueue( clientId, task ),
		[]
	);

	// Tracks new blocks whose registration as an insertion suggestion the
	// store interceptor has DEFERRED: an unmodified default block inserted in
	// Suggest mode (clicking the appender) is not a suggestion until the user
	// puts something into it. The overlay HOC and the inline suggestion
	// keyboards consult this set so the first edit inside such a block falls
	// through to the real attributes — letting the interceptor register the
	// whole block as a single `block-insert-after` suggestion — instead of
	// opening a separate inline/overlay suggestion next to the insertion.
	// A ref-set for the same reason as the bypass set above: it is written
	// from inside `registry.subscribe` and read synchronously during event
	// handling, neither of which can wait on React state.
	const deferredInsertionsRef = useRef( new Set< string >() );

	const markDeferredInsertion = useCallback( ( clientId: string ) => {
		if ( clientId ) {
			deferredInsertionsRef.current.add( clientId );
		}
	}, [] );

	const unmarkDeferredInsertion = useCallback( ( clientId: string ) => {
		deferredInsertionsRef.current.delete( clientId );
	}, [] );

	const isDeferredInsertion = useCallback(
		( clientId: string ) => deferredInsertionsRef.current.has( clientId ),
		[]
	);

	// Reset when a Suggest session starts: a block deferred in a previous
	// session is seeded into the interceptor's snapshot like any other
	// pre-existing block, so a stale entry would wrongly write edits through.
	const clearDeferredInsertions = useCallback( () => {
		deferredInsertionsRef.current.clear();
	}, [] );

	/*
	 * Undo/redo adoption tokens. The undo guard arms one token per undo/redo
	 * dispatch; the store interceptor consumes a token when the resulting
	 * block-editor change lands, and adopts that change as the new capture
	 * baseline instead of treating it as a fresh user edit (which would
	 * re-capture the undo as a brand-new suggestion). Tokens expire (see
	 * UNDO_ADOPTION_TTL_MS) because the block sync happens a React commit
	 * after the dispatch and an undo may turn out to touch nothing
	 * block-related. A counter-of-expiries rather than a boolean so two quick
	 * undo presses arm two adoptions.
	 */
	const undoAdoptionExpiriesRef = useRef< number[] >( [] );

	const armUndoRedoAdoption = useCallback( () => {
		undoAdoptionExpiriesRef.current.push(
			Date.now() + UNDO_ADOPTION_TTL_MS
		);
	}, [] );

	const consumeUndoRedoAdoption = useCallback( () => {
		const expiries = undoAdoptionExpiriesRef.current;
		const now = Date.now();
		while ( expiries.length > 0 && expiries[ 0 ] <= now ) {
			expiries.shift();
		}
		if ( expiries.length === 0 ) {
			return false;
		}
		expiries.shift();
		return true;
	}, [] );

	// Prune overlay entries whose block was removed from the editor. This
	// prevents stale baselines from persisting after a block is deleted.
	// The block-count subscription only runs when there are entries to
	// prune; in Edit / View intent (no entries) there's no point watching
	// the block tree at all.
	const blockCount = useSelect(
		( select ) => {
			if ( ! hasEntries ) {
				return 0;
			}
			const blockEditor: any = select( BLOCK_EDITOR_STORE_NAME );
			return blockEditor?.getClientIdsWithDescendants?.().length ?? 0;
		},
		[ hasEntries ]
	);
	useEffect( () => {
		if ( ! hasEntries ) {
			return;
		}
		const getLive = registry.select( BLOCK_EDITOR_STORE_NAME )
			?.getClientIdsWithDescendants;
		if ( ! getLive ) {
			return;
		}
		const live = getLive();
		const liveSet = new Set( live );
		const hasOrphan = Object.keys( entries ).some(
			( key ) => ! liveSet.has( key )
		);
		if ( hasOrphan ) {
			dispatch( { type: 'PRUNE_ORPHANS', liveClientIds: live } );
		}
	}, [ hasEntries, blockCount, entries, registry ] );

	const value = useMemo(
		() => ( {
			entries,
			captureBaseline,
			setOverlayAttributes,
			clearOverlay,
			clearOverlayForComment,
			setCommentId,
			setSyncedOpsKey,
			setStructuralOp,
			hasOverlay,
			requestInterceptorBypass,
			consumeInterceptorBypass,
			registerFormatHandler,
			requestFormatSuggestion,
			registerContentHandler,
			requestContentSuggestion,
			enqueueSuggestionWrite,
			markDeferredInsertion,
			unmarkDeferredInsertion,
			isDeferredInsertion,
			clearDeferredInsertions,
			getLastContentCaptureSeq,
			armUndoRedoAdoption,
			consumeUndoRedoAdoption,
		} ),
		[
			entries,
			captureBaseline,
			setOverlayAttributes,
			clearOverlay,
			clearOverlayForComment,
			setCommentId,
			setSyncedOpsKey,
			setStructuralOp,
			hasOverlay,
			requestInterceptorBypass,
			consumeInterceptorBypass,
			registerFormatHandler,
			requestFormatSuggestion,
			registerContentHandler,
			requestContentSuggestion,
			enqueueSuggestionWrite,
			markDeferredInsertion,
			unmarkDeferredInsertion,
			isDeferredInsertion,
			clearDeferredInsertions,
			getLastContentCaptureSeq,
			armUndoRedoAdoption,
			consumeUndoRedoAdoption,
		]
	);

	return (
		<OverlayContext.Provider value={ value }>
			{ children }
		</OverlayContext.Provider>
	);
}

/**
 * Hook returning the suggestion overlay API.
 *
 * @return Overlay API.
 */
export function useSuggestionOverlay(): OverlayContextValue {
	return useContext( OverlayContext );
}
