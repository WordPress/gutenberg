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
/**
 * WordPress dependencies
 */
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

// Referenced by name to keep the provider runnable in tests and standalone
// contexts where the block-editor store isn't registered. Orphan cleanup is
// skipped in those environments.
const BLOCK_EDITOR_STORE_NAME = 'core/block-editor';

/**
 * Internal dependencies
 */
import { buildMoveGhostIndex } from './move-ghost-index';

/**
 * @typedef {Object} OverlayEntry
 * @property {string} blockName          The block name at the time the
 *                                       overlay was opened.
 * @property {Object} baselineAttributes The attributes captured when
 *                                       Suggest mode first began editing
 *                                       this block.
 * @property {Object} overlayAttributes  Pending attribute changes that
 *                                       have not yet been committed.
 */

/**
 * @typedef {Object} OverlayContextValue
 * @property {Object.<string,OverlayEntry>} entries              Per-clientId entries.
 * @property {Function}                     captureBaseline      Store a baseline for a
 *                                                               block if one isn't set.
 * @property {Function}                     setOverlayAttributes Merge overlay attributes
 *                                                               onto an entry.
 * @property {Function}                     clearOverlay         Remove the entry.
 * @property {Function}                     hasOverlay           Check if an entry has any
 *                                                               overlay attributes.
 * @property {{after:Map,before:Map}}       moveGhosts           Anchor → ghost
 *                                                               index for pending
 *                                                               moves.
 */

const EMPTY_ENTRIES = Object.freeze( {} );

const EMPTY_GHOSTS = Object.freeze( {
	after: new Map(),
	before: new Map(),
} );

const OverlayContext = createContext( {
	entries: EMPTY_ENTRIES,
	moveGhosts: EMPTY_GHOSTS,
	captureBaseline: () => {},
	setOverlayAttributes: () => {},
	clearOverlay: () => {},
	setCommentId: () => {},
	setSyncedOpsKey: () => {},
	setStructuralOp: () => {},
	hasOverlay: () => false,
	requestInterceptorBypass: () => {},
	consumeInterceptorBypass: () => false,
} );

/**
 * Reducer managing the map of pending block overlays.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Action.
 * @return {Object} Next state.
 */
export function overlayReducer( state, action ) {
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
					structuralOp: action.op,
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
			const next = {};
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
 * @param {{ children: React.ReactNode }} props
 */
export function SuggestionOverlayProvider( { children } ) {
	const [ entries, dispatch ] = useReducer( overlayReducer, EMPTY_ENTRIES );
	const registry = useRegistry();

	const captureBaseline = useCallback(
		( clientId, blockName, attributes ) =>
			dispatch( {
				type: 'CAPTURE_BASELINE',
				clientId,
				blockName,
				attributes,
			} ),
		[]
	);

	const setOverlayAttributes = useCallback(
		( clientId, attributes ) =>
			dispatch( {
				type: 'SET_OVERLAY_ATTRIBUTES',
				clientId,
				attributes,
			} ),
		[]
	);

	const clearOverlay = useCallback(
		( clientId ) => dispatch( { type: 'CLEAR_OVERLAY', clientId } ),
		[]
	);

	const setCommentId = useCallback(
		( clientId, commentId ) =>
			dispatch( { type: 'SET_COMMENT_ID', clientId, commentId } ),
		[]
	);

	const setSyncedOpsKey = useCallback(
		( clientId, syncedOpsKey ) =>
			dispatch( { type: 'SET_SYNCED_OPS_KEY', clientId, syncedOpsKey } ),
		[]
	);

	const setStructuralOp = useCallback(
		( clientId, blockName, op ) =>
			dispatch( {
				type: 'SET_STRUCTURAL_OP',
				clientId,
				blockName,
				op,
			} ),
		[]
	);

	const hasEntries = Object.keys( entries ).length > 0;

	const hasOverlay = useCallback(
		( clientId ) => {
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
	const bypassClientIdsRef = useRef( new Set() );

	const requestInterceptorBypass = useCallback( ( clientId ) => {
		if ( clientId ) {
			bypassClientIdsRef.current.add( clientId );
		}
	}, [] );

	const consumeInterceptorBypass = useCallback( ( clientId ) => {
		const set = bypassClientIdsRef.current;
		if ( ! set.has( clientId ) ) {
			return false;
		}
		set.delete( clientId );
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
			const blockEditor = select( BLOCK_EDITOR_STORE_NAME );
			return blockEditor?.getClientIdsWithDescendants?.().length ?? 0;
		},
		[ hasEntries ]
	);
	useEffect( () => {
		if ( ! hasEntries ) {
			return;
		}
		const getLive = registry.select(
			BLOCK_EDITOR_STORE_NAME
		)?.getClientIdsWithDescendants;
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

	// Single O(n) scan for pending-move markers, shared by every block via
	// context — avoids an O(n^2) per-block scan in the rendering HOC.
	//
	// `useSelect` must return a referentially stable value when state is
	// unchanged (otherwise `@wordpress/data` warns about wasted re-renders),
	// so it returns a primitive signature string that fully determines ghost
	// placement (clientId, old index/anchor/parent, whether the anchor still
	// exists, and the old parent's current first non-self sibling). The
	// index itself is rebuilt only when that signature changes.
	const moveSignature = useSelect( ( select ) => {
		const blockEditor = select( BLOCK_EDITOR_STORE_NAME );
		const ids = blockEditor?.getClientIdsWithDescendants?.() ?? [];
		// Collect the pending-move set first so anchor/sibling resolution in
		// the fingerprint matches `buildMoveGhostIndex`: a block that is
		// itself pending-moved can't anchor a ghost (it would drag the ghost
		// to its destination), so it must be treated as unusable here too —
		// otherwise the memo could miss a recompute when an anchor's
		// moved-state is the only thing that changed.
		const movedIds = new Set();
		for ( const clientId of ids ) {
			if (
				blockEditor.getBlockAttributes( clientId )?.metadata?.suggestion
					?.type === 'pending-move'
			) {
				movedIds.add( clientId );
			}
		}
		let signature = '';
		for ( const clientId of ids ) {
			const marker =
				blockEditor.getBlockAttributes( clientId )?.metadata
					?.suggestion;
			if ( marker?.type !== 'pending-move' ) {
				continue;
			}
			const fromParent = marker.fromParentClientId ?? '';
			const fromAnchor = marker.fromAnchorClientId ?? '';
			const anchorUsable =
				fromAnchor &&
				blockEditor.getBlockName( fromAnchor ) &&
				! movedIds.has( fromAnchor )
					? 1
					: 0;
			const firstSibling =
				blockEditor
					.getBlockOrder( fromParent )
					.find(
						( id ) => id !== clientId && ! movedIds.has( id )
					) ?? '';
			signature += `${ clientId }:${
				marker.fromIndex ?? 0
			}:${ fromAnchor }:${ fromParent }:${ anchorUsable }:${ firstSibling }|`;
		}
		return signature;
	}, [] );

	const moveGhosts = useMemo( () => {
		if ( ! moveSignature ) {
			return EMPTY_GHOSTS;
		}
		const blockEditor = registry.select( BLOCK_EDITOR_STORE_NAME );
		if ( ! blockEditor?.getClientIdsWithDescendants ) {
			return EMPTY_GHOSTS;
		}
		const moved = [];
		for ( const clientId of blockEditor.getClientIdsWithDescendants() ) {
			const marker =
				blockEditor.getBlockAttributes( clientId )?.metadata
					?.suggestion;
			if ( marker?.type === 'pending-move' ) {
				moved.push( {
					clientId,
					name: blockEditor.getBlockName( clientId ),
					authorId: marker.authorId ?? null,
					fromAnchorClientId: marker.fromAnchorClientId ?? null,
					fromParentClientId: marker.fromParentClientId ?? '',
					fromIndex: marker.fromIndex ?? 0,
				} );
			}
		}
		if ( moved.length === 0 ) {
			return EMPTY_GHOSTS;
		}
		return buildMoveGhostIndex( moved, {
			blockExists: ( id ) => !! blockEditor.getBlockName( id ),
			getSiblings: ( parentId ) => blockEditor.getBlockOrder( parentId ),
		} );
	}, [ moveSignature, registry ] );

	const value = useMemo(
		() => ( {
			entries,
			moveGhosts,
			captureBaseline,
			setOverlayAttributes,
			clearOverlay,
			setCommentId,
			setSyncedOpsKey,
			setStructuralOp,
			hasOverlay,
			requestInterceptorBypass,
			consumeInterceptorBypass,
		} ),
		[
			entries,
			moveGhosts,
			captureBaseline,
			setOverlayAttributes,
			clearOverlay,
			setCommentId,
			setSyncedOpsKey,
			setStructuralOp,
			hasOverlay,
			requestInterceptorBypass,
			consumeInterceptorBypass,
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
 * @return {OverlayContextValue} Overlay API.
 */
export function useSuggestionOverlay() {
	return useContext( OverlayContext );
}
