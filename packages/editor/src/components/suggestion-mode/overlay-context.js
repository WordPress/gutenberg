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
} from '@wordpress/element';
import { useRegistry, useSelect } from '@wordpress/data';

// Referenced by name to keep the provider runnable in tests and standalone
// contexts where the block-editor store isn't registered. Orphan cleanup is
// skipped in those environments.
const BLOCK_EDITOR_STORE_NAME = 'core/block-editor';

/**
 * Internal dependencies
 */

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
 */

const EMPTY_ENTRIES = Object.freeze( {} );

const OverlayContext = createContext( {
	entries: EMPTY_ENTRIES,
	captureBaseline: () => {},
	setOverlayAttributes: () => {},
	clearOverlay: () => {},
	hasOverlay: () => false,
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

	const value = useMemo(
		() => ( {
			entries,
			captureBaseline,
			setOverlayAttributes,
			clearOverlay,
			hasOverlay,
		} ),
		[
			entries,
			captureBaseline,
			setOverlayAttributes,
			clearOverlay,
			hasOverlay,
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
