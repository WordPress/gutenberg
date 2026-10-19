/**
 * The path a lock covers, below its store.
 */
export type LockPath = readonly ( string | number )[];

/**
 * A granted lock.
 */
export interface Lock {
	store: string;
	path: LockPath;
	exclusive: boolean;
}

/**
 * A lock request waiting for its lock.
 */
export interface LockRequest extends Lock {
	notifyAcquired: ( lock: Lock ) => void;
}

/**
 * A node of the locks tree, holding the locks on its path.
 */
export interface LockNode {
	locks: Lock[];
	children: Record< string, LockNode >;
}

/**
 * The locks state.
 */
export interface LocksState {
	requests: LockRequest[];
	tree: LockNode;
}

/**
 * An action the locks reducer handles.
 */
export type LocksAction =
	| { type: '@@INIT' }
	| { type: 'ENQUEUE_LOCK_REQUEST'; request: LockRequest }
	| { type: 'GRANT_LOCK_REQUEST'; lock: Lock; request: LockRequest }
	| { type: 'RELEASE_LOCK'; lock: Lock };
