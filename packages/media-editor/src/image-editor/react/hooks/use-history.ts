/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

export interface UseHistoryOptions< T > {
	/** Current state to observe for debounced history entries. */
	state: T;
	/** Compare two history states. */
	isEqual: ( a: T, b: T ) => boolean;
	/** Apply a state restored from undo/redo history. */
	onApplyState: ( state: T ) => void;
	/** Milliseconds of inactivity before a continuous edit is committed. */
	debounceMs: number;
}

export interface UseHistoryReturn< T > {
	/** Whether there is a history state to undo. */
	hasUndo: boolean;
	/** Whether there is a history state to redo. */
	hasRedo: boolean;
	/** Push a specific entry, or the current state, to undo history. */
	pushHistory: ( entry?: T ) => void;
	/** Flush the pending debounced history entry immediately. */
	commitHistory: () => void;
	/** Undo the last committed state. */
	undo: () => void;
	/** Redo the last undone state. */
	redo: () => void;
	/** Suppress the next observed state change from creating history. */
	suppressNextChange: ( options?: { clearPending?: boolean } ) => void;
	/** Clear undo/redo history and optionally replace the clean baseline. */
	clearHistory: ( state?: T ) => void;
}

/**
 * Generic snapshot history for editing surfaces.
 *
 * Continuous edits are committed with a debounce, while callers can still push
 * discrete edits immediately. This mirrors the cropper history semantics and is
 * intentionally state-shape agnostic so the image editing session can later
 * reuse the same behavior for adjustments and extension transactions.
 *
 * @param options
 * @param options.state
 * @param options.isEqual
 * @param options.onApplyState
 * @param options.debounceMs
 */
export function useHistory< T >( {
	state,
	isEqual,
	onApplyState,
	debounceMs,
}: UseHistoryOptions< T > ): UseHistoryReturn< T > {
	const stateRef = useRef( state );

	const historyRef = useRef< T[] >( [] );
	const redoStackRef = useRef< T[] >( [] );
	const [ hasUndo, setHasUndo ] = useState( false );
	const [ hasRedo, setHasRedo ] = useState( false );

	const lastCommittedStateRef = useRef< T | null >( state );
	const debounceTimerRef = useRef< ReturnType< typeof setTimeout > >();
	const suppressDebounceRef = useRef( false );

	useEffect( () => {
		stateRef.current = state;
	}, [ state ] );

	const pushHistory = useCallback(
		( entry?: T ) => {
			const target = entry ?? stateRef.current;
			const previousEntry =
				historyRef.current[ historyRef.current.length - 1 ];
			if ( previousEntry && isEqual( previousEntry, target ) ) {
				return;
			}
			historyRef.current = [ ...historyRef.current, target ];
			redoStackRef.current = [];
			setHasUndo( true );
			setHasRedo( false );
		},
		[ isEqual ]
	);

	useEffect( () => {
		if ( suppressDebounceRef.current ) {
			suppressDebounceRef.current = false;
			lastCommittedStateRef.current = stateRef.current;
			return;
		}
		if (
			lastCommittedStateRef.current !== null &&
			isEqual( lastCommittedStateRef.current, stateRef.current )
		) {
			lastCommittedStateRef.current = stateRef.current;
			return;
		}
		clearTimeout( debounceTimerRef.current );
		debounceTimerRef.current = setTimeout( () => {
			const snapshot = lastCommittedStateRef.current;
			if (
				snapshot !== null &&
				! isEqual( snapshot, stateRef.current )
			) {
				pushHistory( snapshot );
			}
			lastCommittedStateRef.current = stateRef.current;
		}, debounceMs );
		return () => clearTimeout( debounceTimerRef.current );
	}, [ state, isEqual, pushHistory, debounceMs ] );

	const commitHistory = useCallback( () => {
		clearTimeout( debounceTimerRef.current );
		const snapshot = lastCommittedStateRef.current;
		if ( snapshot !== null && ! isEqual( snapshot, stateRef.current ) ) {
			pushHistory( snapshot );
		}
		lastCommittedStateRef.current = stateRef.current;
	}, [ isEqual, pushHistory ] );

	const suppressNextChange = useCallback(
		( options: { clearPending?: boolean } = {} ) => {
			if ( options.clearPending ) {
				clearTimeout( debounceTimerRef.current );
			}
			suppressDebounceRef.current = true;
		},
		[]
	);

	const clearHistory = useCallback( ( nextState?: T ) => {
		clearTimeout( debounceTimerRef.current );
		historyRef.current = [];
		redoStackRef.current = [];
		lastCommittedStateRef.current = nextState ?? stateRef.current;
		setHasUndo( false );
		setHasRedo( false );
	}, [] );

	const undo = useCallback( () => {
		commitHistory();
		const prev = historyRef.current[ historyRef.current.length - 1 ];
		if ( ! prev ) {
			return;
		}
		redoStackRef.current = [ stateRef.current, ...redoStackRef.current ];
		historyRef.current = historyRef.current.slice( 0, -1 );
		suppressNextChange();
		setHasUndo( historyRef.current.length > 0 );
		setHasRedo( true );
		onApplyState( prev );
	}, [ commitHistory, onApplyState, suppressNextChange ] );

	const redo = useCallback( () => {
		commitHistory();
		const next = redoStackRef.current[ 0 ];
		if ( ! next ) {
			return;
		}
		historyRef.current = [ ...historyRef.current, stateRef.current ];
		redoStackRef.current = redoStackRef.current.slice( 1 );
		suppressNextChange();
		setHasUndo( true );
		setHasRedo( redoStackRef.current.length > 0 );
		onApplyState( next );
	}, [ commitHistory, onApplyState, suppressNextChange ] );

	return {
		hasUndo,
		hasRedo,
		pushHistory,
		commitHistory,
		undo,
		redo,
		suppressNextChange,
		clearHistory,
	};
}
