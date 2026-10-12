/**
 * Per-session coordination for Suggest mode.
 *
 * What lives here is state that only one editor session needs and that
 * must never reach post content: interceptor bypass tokens, the single
 * format and content handler slots, the per-block write queue, the set of
 * deferred insertions, undo/redo adoption tokens, and the structural
 * operations the interceptor captured as they happened. Post field
 * proposals (the title, excerpt and the rest) live in the editor store, so
 * `editPost` can hold them and `getEditedPostAttribute` can show them.
 *
 * What does NOT live here: proposals. A pending attribute suggestion is
 * written into the block's own `metadata.suggestion.after` (see `marker.ts`),
 * exactly as structural markers and inline `<mark>` runs already are, so it
 * saves with the post, syncs to peers and sits on the undo stack like any
 * other edit. This context used to hold those proposals as an in-memory
 * overlay; that store is gone.
 */
import type { ReactNode } from 'react';
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
} from '@wordpress/element';
import { createSuggestionWriteQueue } from './suggestion-write-queue';
import type { SuggestionWriteQueue } from './suggestion-write-queue';
import type { SuggestionOperation } from './operations';

export type { SuggestionOperation };

/*
 * Monotonic sequence shared by every capture path so the undo guard can order
 * a structural capture (which the guard withdraws by hand) against captures
 * the history stack owns (inline marker writes, attribute proposal writes).
 * Module-scoped: the ordering only needs to be consistent within a session,
 * not persisted.
 */
let captureSequence = 0;
export const nextCaptureSeq = () => ++captureSequence;

/*
 * How long an armed undo/redo adoption token stays valid. The token is armed
 * synchronously when undo/redo dispatches, but the block-editor tree only
 * reflects the entity change after React re-renders and the block-sync effect
 * runs, an async gap the interceptor can't observe directly. The expiry
 * bounds the window so a stale token (an undo that ended up changing nothing
 * block-related) can't swallow a later genuine edit.
 */
const UNDO_ADOPTION_TTL_MS = 1000;

/**
 * A structural operation the interceptor built as it saw the tree change.
 * Auto-save prefers it over an op derived from the marker alone (it saw the
 * mutation happen), and the undo guard orders it by `seq`.
 */
export interface StructuralCapture {
	op: SuggestionOperation;
	blockName: string;
	seq: number;
}

/**
 * Handler invoked with a format/content suggestion request. Returning
 * `false` means the handler cannot process the request and the edit must
 * fall through to the attribute-proposal path; anything else counts as
 * accepted.
 */
type SuggestionRequestHandler = ( request: any ) => unknown;

export interface SuggestionSessionActions {
	requestInterceptorBypass: ( clientId: string ) => void;
	consumeInterceptorBypass: ( clientId: string ) => boolean;
	hasInterceptorBypass: () => boolean;
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
	noteHistoryCapture: () => void;
	armUndoRedoAdoption: () => void;
	consumeUndoRedoAdoption: () => boolean;
	recordStructuralCapture: (
		clientId: string,
		blockName: string,
		op: SuggestionOperation
	) => void;
	clearStructuralCapture: ( clientId: string ) => void;
	getStructuralCaptures: () => ReadonlyMap< string, StructuralCapture >;
}

export type SuggestionSessionValue = SuggestionSessionActions;

const DEFAULT_ACTIONS: SuggestionSessionActions = {
	requestInterceptorBypass: () => {},
	consumeInterceptorBypass: () => false,
	hasInterceptorBypass: () => false,
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
	noteHistoryCapture: () => {},
	armUndoRedoAdoption: () => {},
	consumeUndoRedoAdoption: () => false,
	recordStructuralCapture: () => {},
	clearStructuralCapture: () => {},
	getStructuralCaptures: () => new Map(),
};

const SessionContext =
	createContext< SuggestionSessionValue >( DEFAULT_ACTIONS );

const SessionActionsContext =
	createContext< SuggestionSessionActions >( DEFAULT_ACTIONS );

/**
 * Provider for the per-session Suggest mode coordination state.
 *
 * @param props          Props.
 * @param props.children Children.
 */
export function SuggestionSessionProvider( {
	children,
}: {
	children: ReactNode;
} ) {
	/*
	 * Sequence stamp of the most recent capture that lives on the real undo
	 * stack (an inline marker write or an attribute proposal write). The
	 * undo guard compares it against the structural captures' `seq` to
	 * decide whether Ctrl+Z should withdraw a structural suggestion by hand
	 * or perform a normal undo. A ref because it is written from
	 * `registry.subscribe` and event handlers, and read synchronously inside
	 * the wrapped undo dispatch.
	 */
	const lastContentCaptureSeqRef = useRef( 0 );

	const getLastContentCaptureSeq = useCallback(
		() => lastContentCaptureSeqRef.current,
		[]
	);

	// The HOC calls this when it writes a proposal into a block marker: that
	// write is a persistent change the history stack owns, so it must sort
	// above every structural capture made before it.
	const noteHistoryCapture = useCallback( () => {
		lastContentCaptureSeqRef.current = nextCaptureSeq();
	}, [] );

	// Structural ops the interceptor captured this session, by block. A ref
	// (not state): written from `registry.subscribe`, read inside the undo
	// dispatch wrapper and inside auto-save timers, none of which can wait
	// on a React commit.
	const structuralCapturesRef = useRef(
		new Map< string, StructuralCapture >()
	);
	const recordStructuralCapture = useCallback(
		( clientId: string, blockName: string, op: SuggestionOperation ) => {
			structuralCapturesRef.current.set( clientId, {
				op,
				blockName,
				seq: nextCaptureSeq(),
			} );
		},
		[]
	);
	const clearStructuralCapture = useCallback( ( clientId: string ) => {
		structuralCapturesRef.current.delete( clientId );
	}, [] );
	const getStructuralCaptures = useCallback(
		() =>
			structuralCapturesRef.current as ReadonlyMap<
				string,
				StructuralCapture
			>,
		[]
	);

	// Tracks clientIds whose next block-attribute mutation should bypass the
	// store interceptor. The accept-suggestion flow uses this to land applied
	// attributes on the live block; without it, the interceptor would treat
	// the apply as just another user edit and divert it into a proposal.
	// A ref-set because the value is consumed inside `registry.subscribe`
	// (which doesn't react to React state) and must clear synchronously when
	// the dispatch is processed.
	const bypassClientIdsRef = useRef( new Set< string >() );

	const requestInterceptorBypass = useCallback( ( clientId: string ) => {
		if ( clientId ) {
			bypassClientIdsRef.current.add( clientId );
			/*
			 * Every inline marker write (addition/deletion/format keyboards,
			 * content reconciler) requests a bypass first, so this doubles as
			 * the "an inline capture happened" stamp for the undo guard.
			 * Apply/reject flows bump it too, which is harmless; ordering
			 * only matters relative to the structural captures above.
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

	const hasInterceptorBypass = useCallback(
		() => bypassClientIdsRef.current.size > 0,
		[]
	);

	// Single slot for the format-suggestion handler. The per-block HOC only
	// *detects* a formatting-only edit (cheap, no store access); the actual
	// note creation + marker write lives in one mounted component
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
		 * to the proposal path rather than swallow it. Anything else,
		 * including a promise from an async handler, counts as accepted.
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
	// puts something into it. The HOC and the inline suggestion keyboards
	// consult this set so the first edit inside such a block falls through to
	// the real attributes, letting the interceptor register the whole block as
	// a single `block-insert-after` suggestion, instead of opening a separate
	// inline or attribute suggestion next to the insertion. A ref-set for the
	// same reason as the bypass set above: it is written from inside
	// `registry.subscribe` and read synchronously during event handling,
	// neither of which can wait on React state.
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

	const actions = useMemo< SuggestionSessionActions >(
		() => ( {
			requestInterceptorBypass,
			consumeInterceptorBypass,
			hasInterceptorBypass,
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
			noteHistoryCapture,
			armUndoRedoAdoption,
			consumeUndoRedoAdoption,
			recordStructuralCapture,
			clearStructuralCapture,
			getStructuralCaptures,
		} ),
		[
			requestInterceptorBypass,
			consumeInterceptorBypass,
			hasInterceptorBypass,
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
			noteHistoryCapture,
			armUndoRedoAdoption,
			consumeUndoRedoAdoption,
			recordStructuralCapture,
			clearStructuralCapture,
			getStructuralCaptures,
		]
	);

	return (
		<SessionActionsContext.Provider value={ actions }>
			<SessionContext.Provider value={ actions }>
				{ children }
			</SessionContext.Provider>
		</SessionActionsContext.Provider>
	);
}

/**
 * The session API.
 *
 * @return Session value.
 */
export function useSuggestionSession(): SuggestionSessionValue {
	return useContext( SessionContext );
}

/**
 * The session API without state. Its value never changes identity, so
 * per-block consumers can use it without re-rendering.
 *
 * @return Session actions.
 */
export function useSuggestionSessionActions(): SuggestionSessionActions {
	return useContext( SessionActionsContext );
}
