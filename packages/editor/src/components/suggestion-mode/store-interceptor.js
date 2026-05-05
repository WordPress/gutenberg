/**
 * Store-level safety net for Suggest mode.
 *
 * `withSuggestionOverlay` already diverts attribute changes that go through a
 * block's `setAttributes` prop. This file handles the other half: mutations
 * that bypass the prop chain by dispatching `updateBlockAttributes` directly
 * to the block-editor store. The block-switcher (heading variation H2 → H3)
 * and any third-party code that uses the data store API land here.
 *
 * Strategy (see `SuggestionStoreInterceptor` for the fully-commented flow):
 *   - On Suggest activation, snapshot every block's attributes.
 *   - Subscribe to the registry. When a dispatch lands the subscribe fires;
 *     diff the live attributes against the snapshot.
 *   - For drift on a tracked block: route the changed attributes into the
 *     overlay and dispatch a revert that restores the snapshot.
 *   - The `isReverting` flag suppresses the recursive subscribe fire that
 *     the revert dispatch itself would otherwise trigger.
 *   - System-managed metadata (`metadata.noteId` written by the suggestion
 *     provider after creating a note comment) is folded into the snapshot
 *     before diffing so it's invisible to the diff and never leaks into the
 *     user-pending overlay.
 *
 * Why subscribe rather than React state:
 *   - The interceptor must run after the dispatch lands but before any
 *     React re-render serializes the (now wrong) state. `registry.subscribe`
 *     fires synchronously immediately after every store update.
 *   - Subscribe also catches dispatches from non-React paths (CLI scripts,
 *     keyboard handlers, external integrations) that wouldn't trigger a
 *     `useSelect`-based watcher.
 *
 * New blocks (no snapshot entry) are tracked but not intercepted — inserting
 * a block in Suggest mode is currently a real edit, not a suggestion.
 */
/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';
import { parseSuggestionPayload } from './provider';

const BLOCK_EDITOR_STORE_NAME = 'core/block-editor';

/**
 * Read note IDs from a block's `metadata.noteId`. Originally a scalar; the
 * multi-note threads change (issue #75147) widens it to an array. Inlined
 * here so this module doesn't depend on a helper that lands in a later
 * stack PR — it accepts either shape and returns a normalized array.
 *
 * @param {Object|undefined} metadata Block metadata.
 * @return {Array<number|string>} Normalized note ids (empty when none).
 */
function readNoteIds( metadata ) {
	const value = metadata?.noteId;
	if ( Array.isArray( value ) ) {
		return value.filter(
			( id ) => id !== null && id !== undefined && id !== ''
		);
	}
	if ( value === null || value === undefined || value === '' ) {
		return [];
	}
	return [ value ];
}

/**
 * Keys under `metadata` that are programmatic linkages set by editor-internal
 * code (the suggestion provider writes `metadata.noteId` after creating a
 * note comment to link the block back to its note). These must persist on
 * the live block — without the linkage, `useNoteThreads` can't resolve a
 * note's `blockClientId` and the note appears orphaned. The interceptor
 * folds changes to these keys into its snapshot before diffing so they are
 * never reverted and never routed into the user-pending overlay.
 */
const SYSTEM_METADATA_KEYS = new Set( [ 'noteId', 'suggestion' ] );

/**
 * Compare two attribute values structurally. Mirrors `isAttributeEqual` in
 * provider.js — kept as a private helper here so this module doesn't pull
 * in the provider's hooks just for the comparison.
 *
 * @param {*} a First value.
 * @param {*} b Second value.
 * @return {boolean} True when the two values are structurally equal.
 */
function shallowAttributeEquals( a, b ) {
	if ( a === b ) {
		return true;
	}
	if ( a === null || a === undefined || b === null || b === undefined ) {
		return false;
	}
	const aIsObject = typeof a === 'object';
	const bIsObject = typeof b === 'object';
	if ( aIsObject !== bIsObject ) {
		// One side is a wrapper (e.g. RichTextData) and the other is a
		// primitive (e.g. a string from a JSON-decoded suggestion payload).
		// Compare their string projections so the two sides of that
		// serialization boundary read as equal when their content matches.
		return String( a ) === String( b );
	}
	if ( ! aIsObject ) {
		return false;
	}
	const aIsArray = Array.isArray( a );
	const bIsArray = Array.isArray( b );
	if ( aIsArray !== bIsArray ) {
		return false;
	}
	if ( aIsArray ) {
		if ( a.length !== b.length ) {
			return false;
		}
		for ( let i = 0; i < a.length; i++ ) {
			if ( ! shallowAttributeEquals( a[ i ], b[ i ] ) ) {
				return false;
			}
		}
		return true;
	}
	const aKeys = Object.keys( a );
	const bKeys = Object.keys( b );
	if ( aKeys.length !== bKeys.length ) {
		return false;
	}
	// Wrapper objects like `RichTextData` hold their content in private
	// class fields, so `Object.keys()` returns an empty array regardless
	// of the text or formatting they wrap. Without a string fallback the
	// loop below is vacuously equal and two different RichTextData values
	// look identical to the interceptor.
	if ( aKeys.length === 0 ) {
		return String( a ) === String( b );
	}
	for ( const key of aKeys ) {
		if ( ! Object.prototype.hasOwnProperty.call( b, key ) ) {
			return false;
		}
		if ( ! shallowAttributeEquals( a[ key ], b[ key ] ) ) {
			return false;
		}
	}
	return true;
}

/**
 * Diff two attribute objects, returning a map of `{ key: currentValue }` for
 * keys whose value has changed and `{ key: previousValue }` for the keys that
 * need to be restored on the block.
 *
 * @param {Object} previous Attributes before the mutation.
 * @param {Object} current  Attributes after the mutation.
 * @return {{ changed: Object, restore: Object }|null} Per-key delta, or null
 * when no keys changed.
 */
function diffAttributes( previous, current ) {
	const changed = {};
	const restore = {};
	let hasChange = false;
	const seen = new Set();

	for ( const key of Object.keys( current ) ) {
		seen.add( key );
		const prevValue = previous?.[ key ];
		const currValue = current[ key ];
		if ( ! shallowAttributeEquals( prevValue, currValue ) ) {
			changed[ key ] = currValue;
			restore[ key ] = prevValue ?? undefined;
			hasChange = true;
		}
	}

	for ( const key of Object.keys( previous ?? {} ) ) {
		if ( seen.has( key ) ) {
			continue;
		}
		// Key was removed by the mutation.
		changed[ key ] = undefined;
		restore[ key ] = previous[ key ];
		hasChange = true;
	}

	return hasChange ? { changed, restore } : null;
}

/**
 * Fold the values of system-managed metadata keys from `current` into a copy
 * of `previous`. The result is used as the snapshot baseline for the next
 * diff so a programmatic update to (e.g.) `metadata.noteId` is invisible to
 * the diff and the revert payload preserves the new value.
 *
 * Returns `previous` unchanged when no system key has drifted.
 *
 * @param {Object} previous Snapshot attributes.
 * @param {Object} current  Live attributes.
 * @return {Object} Snapshot attributes with system metadata adopted.
 */
function adoptSystemMetadata( previous, current ) {
	const previousMeta = previous?.metadata ?? {};
	const currentMeta = current?.metadata ?? {};
	let nextMeta = previousMeta;
	let touched = false;
	for ( const key of SYSTEM_METADATA_KEYS ) {
		const prevValue = previousMeta[ key ];
		const currValue = currentMeta[ key ];
		if ( prevValue === currValue ) {
			continue;
		}
		if ( ! touched ) {
			nextMeta = { ...previousMeta };
			touched = true;
		}
		if ( currValue === undefined ) {
			delete nextMeta[ key ];
		} else {
			nextMeta[ key ] = currValue;
		}
	}
	if ( ! touched ) {
		return previous;
	}
	return {
		...previous,
		metadata: nextMeta,
	};
}

/**
 * Strip system-managed metadata keys from a `changed` payload destined for
 * the suggestion overlay. The overlay represents user-pending edits; system
 * fields such as `metadata.noteId` must never appear there because they are
 * not part of the user's suggestion and would otherwise leak into the
 * persisted suggestion operations.
 *
 * Drops the `metadata` key entirely when no non-system fields remain.
 *
 * @param {Object} changed `delta.changed` from `diffAttributes`.
 * @return {Object} Filtered payload safe for the overlay.
 */
function stripSystemMetadata( changed ) {
	const meta = changed?.metadata;
	if ( ! meta || typeof meta !== 'object' ) {
		return changed;
	}
	let stripped = meta;
	let touched = false;
	for ( const key of SYSTEM_METADATA_KEYS ) {
		if ( Object.prototype.hasOwnProperty.call( meta, key ) ) {
			if ( ! touched ) {
				stripped = { ...meta };
				touched = true;
			}
			delete stripped[ key ];
		}
	}
	if ( ! touched ) {
		return changed;
	}
	if ( Object.keys( stripped ).length === 0 ) {
		const { metadata: _drop, ...rest } = changed;
		return rest;
	}
	return { ...changed, metadata: stripped };
}

/**
 * Detect whether a delta represents the acceptance of a known suggestion that
 * has been propagated to this client — most often, another peer clicked
 * "Apply suggestion" and the resulting block-attribute change arrived through
 * the sync layer. For each note linked to the block via `metadata.noteId`,
 * the comment's `_wp_suggestion` payload is consulted; when every changed
 * attribute lands on an `after` value declared by one of those payloads, the
 * change is treated as an apply and the interceptor adopts `current` as the
 * new baseline rather than reverting.
 *
 * Without this check the interceptor — running on the suggester's side —
 * reverts the incoming applied attributes, then propagates that revert back
 * through the sync layer, which undoes the apply on the accepter's screen
 * a moment after they clicked.
 *
 * @param {Object|null} coreSelect        Selectors for the core-data store,
 *                                        or `null` when the store isn't
 *                                        registered (e.g. unit tests).
 * @param {Object}      currentAttributes Block attributes after the mutation.
 * @param {Object}      delta             Output of `diffAttributes`.
 * @return {boolean} True when every changed key matches a suggestion's `after`.
 */
function isAcceptedSuggestionChange( coreSelect, currentAttributes, delta ) {
	if ( ! coreSelect?.getEntityRecord ) {
		return false;
	}
	const noteIds = readNoteIds( currentAttributes?.metadata );
	if ( noteIds.length === 0 ) {
		return false;
	}
	const changedKeys = Object.keys( delta.changed );
	if ( changedKeys.length === 0 ) {
		return false;
	}

	const matched = new Set();
	for ( const noteId of noteIds ) {
		const comment = coreSelect.getEntityRecord( 'root', 'comment', noteId );
		const payload = parseSuggestionPayload( comment?.meta?._wp_suggestion );
		if ( ! payload ) {
			continue;
		}
		for ( const op of payload.operations ) {
			if ( op.type !== 'attribute-set' ) {
				continue;
			}
			if (
				! Object.prototype.hasOwnProperty.call(
					delta.changed,
					op.attribute
				)
			) {
				continue;
			}
			if (
				shallowAttributeEquals(
					op.after,
					currentAttributes?.[ op.attribute ]
				)
			) {
				matched.add( op.attribute );
			}
		}
	}

	return changedKeys.every( ( key ) => matched.has( key ) );
}

/**
 * Marker shape stored at `metadata.suggestion` on a block to indicate a
 * pending structural suggestion. The block stays in the live tree; the
 * marker drives the visual treatment and tells the auto-save loop to
 * persist the corresponding structural operation. Cleared on apply or
 * reject. See `docs/explanations/architecture/suggestions.md` for the
 * "apply-and-tag" rationale.
 *
 * @typedef {Object} SuggestionMarker
 * @property {'pending-remove'|'pending-insert'|'pending-move'} type        Op type
 *                                                                          the marker represents.
 * @property {number}                                           [commentId] Filled in by auto-save once a note comment
 *                                                                          exists for this marker.
 */

/**
 * Walk the live block-editor tree and capture the parent + index of every
 * block. Used by the removal-detection branch to re-insert a block at its
 * previous position when the live tree drops it.
 *
 * @param {Object} blockEditor Block-editor selectors (`registry.select(
 *                             'core/block-editor' )`).
 * @return {{
 *   blocksByClientId: Map<string, Object>,
 *   parentByClientId: Map<string, string|null>,
 *   indexByClientId:  Map<string, number>,
 * }} Tree snapshot.
 */
function captureTreeSnapshot( blockEditor ) {
	const blocksByClientId = new Map();
	const parentByClientId = new Map();
	const indexByClientId = new Map();

	const walk = ( clientIds, parentClientId ) => {
		for ( let index = 0; index < clientIds.length; index++ ) {
			const clientId = clientIds[ index ];
			const block = blockEditor.getBlock?.( clientId );
			if ( ! block ) {
				continue;
			}
			blocksByClientId.set( clientId, block );
			parentByClientId.set( clientId, parentClientId );
			indexByClientId.set( clientId, index );
			const childIds = blockEditor.getBlockOrder?.( clientId ) ?? [];
			if ( childIds.length > 0 ) {
				walk( childIds, clientId );
			}
		}
	};
	walk( blockEditor.getBlockOrder?.() ?? [], null );

	return { blocksByClientId, parentByClientId, indexByClientId };
}

/**
 * Add or replace the `metadata.suggestion` marker on an attributes object,
 * leaving every other field untouched. Returns a new object — the caller
 * passes it to `updateBlockAttributes`, which performs its own merge.
 *
 * @param {Object}           currentMetadata Current block metadata.
 * @param {SuggestionMarker} marker          Marker to write.
 * @return {Object} New metadata with the marker applied.
 */
function withSuggestionMarker( currentMetadata, marker ) {
	return {
		...( currentMetadata || {} ),
		suggestion: marker,
	};
}

/**
 * Filter a list of removed clientIds down to the topmost ancestors — the
 * parents whose subtree contains the rest. Re-inserting a top-level removed
 * block restores its descendants automatically; re-inserting both a parent
 * and its child would duplicate the child.
 *
 * @param {string[]}                 removedIds       All clientIds missing
 *                                                    from the live tree.
 * @param {Map<string, string|null>} parentByClientId Snapshot parents.
 * @return {string[]} Top-level removed clientIds.
 */
function topLevelRemoved( removedIds, parentByClientId ) {
	const removedSet = new Set( removedIds );
	return removedIds.filter( ( id ) => {
		const parent = parentByClientId.get( id );
		return parent === null || ! removedSet.has( parent );
	} );
}

/**
 * Invisible component that catches block-attribute mutations dispatched
 * directly to the block-editor store while the editor is in Suggest intent.
 *
 * The `editor.BlockEdit` HOC already intercepts `setAttributes` calls that
 * blocks make through their own props. But some Gutenberg paths bypass that
 * prop chain — most notably the block-switcher's variation picker, which
 * calls `updateBlockAttributes( clientId, { level } )` directly to swap a
 * heading from H2 → H3. Without this interceptor those mutations would land
 * in the post unmodified, defeating Suggest mode.
 *
 * Strategy: snapshot every block's attributes when Suggest intent activates,
 * then on every block-editor state change diff the live tree against the
 * snapshot. Any block whose attributes drift from the snapshot has its
 * change re-routed into the overlay and the live attributes restored to the
 * snapshot. New blocks (no snapshot entry) are tracked but not intercepted —
 * inserting a block in Suggest mode is currently a real edit, not a
 * suggestion. Removed blocks are dropped from the snapshot.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionStoreInterceptor() {
	const {
		entries,
		captureBaseline,
		setOverlayAttributes,
		setStructuralOp,
		consumeInterceptorBypass,
	} = useSuggestionOverlay();
	const registry = useRegistry();

	const isSuggestMode = useSelect(
		( select ) =>
			select( EDITOR_STORE_NAME ).getEditorIntent() === SUGGEST_INTENT,
		[]
	);

	// Mutable references read from inside the subscribe callback. Using refs
	// avoids resubscribing on every entries / overlay change. They are kept in
	// sync from an effect rather than during render so the latest values are
	// available to the callback without accessing refs while rendering.
	const entriesRef = useRef( entries );
	const captureBaselineRef = useRef( captureBaseline );
	const setOverlayAttributesRef = useRef( setOverlayAttributes );
	const setStructuralOpRef = useRef( setStructuralOp );
	const consumeInterceptorBypassRef = useRef( consumeInterceptorBypass );

	useEffect( () => {
		entriesRef.current = entries;
		captureBaselineRef.current = captureBaseline;
		setOverlayAttributesRef.current = setOverlayAttributes;
		setStructuralOpRef.current = setStructuralOp;
		consumeInterceptorBypassRef.current = consumeInterceptorBypass;
	} );

	useEffect( () => {
		if ( ! isSuggestMode ) {
			return undefined;
		}

		const blockEditor = registry.select( BLOCK_EDITOR_STORE_NAME );
		const blockEditorDispatch = registry.dispatch(
			BLOCK_EDITOR_STORE_NAME
		);
		if ( ! blockEditor || ! blockEditorDispatch ) {
			return undefined;
		}

		// `coreStore` may be unregistered in unit tests; the helper that
		// reads suggestion comments handles a `null` selector defensively.
		const coreSelect = registry.select( coreStore );

		// Snapshot of every block's attributes at the moment Suggest mode
		// activated. New blocks added during the session are slotted in as
		// they appear; mutations on existing blocks are reverted + overlaid.
		const snapshot = new Map();
		const seedClientIds = blockEditor.getClientIdsWithDescendants?.() ?? [];
		for ( const clientId of seedClientIds ) {
			snapshot.set(
				clientId,
				blockEditor.getBlockAttributes( clientId )
			);
		}

		// Tree snapshot from the previous tick. Used by the removal-
		// detection branch to recover a block's parent + index + content
		// after the block-editor store has dropped it. Refreshed at the end
		// of every fire so the next fire can compare against the most
		// recently-stable state.
		let tree = captureTreeSnapshot( blockEditor );

		// Set true while we're calling `updateBlockAttributes` to revert a
		// detected mutation, so the resulting subscribe fire doesn't loop.
		let isReverting = false;

		const unsubscribe = registry.subscribe( () => {
			if ( isReverting ) {
				return;
			}

			const liveClientIds =
				blockEditor.getClientIdsWithDescendants?.() ?? [];
			const live = new Set( liveClientIds );

			for ( const clientId of liveClientIds ) {
				let previous = snapshot.get( clientId );
				const current = blockEditor.getBlockAttributes( clientId );

				// Apply-suggestion flow: the provider opts the next mutation
				// out of interception so the applied attributes land on the
				// live block. Adopt `current` as the new baseline so the
				// next user edit diffs against the post-apply state.
				if ( consumeInterceptorBypassRef.current?.( clientId ) ) {
					snapshot.set( clientId, current );
					continue;
				}

				if ( previous === undefined ) {
					// New block (inserted after Suggest activated). Track it
					// but don't intercept.
					snapshot.set( clientId, current );
					continue;
				}

				if ( previous === current ) {
					// Block-editor preserves attribute object identity for
					// untouched blocks, so this short-circuit covers the
					// common case cheaply.
					continue;
				}

				// Programmatic linkage updates (e.g. `metadata.noteId` set by
				// the suggestion provider after creating the note comment)
				// must persist on the live block. Folding them into the
				// snapshot before diffing makes them invisible to the diff,
				// keeps the revert payload from clobbering them, and prevents
				// them from leaking into the user's overlay.
				const adopted = adoptSystemMetadata( previous, current );
				if ( adopted !== previous ) {
					snapshot.set( clientId, adopted );
					previous = adopted;
				}

				const delta = diffAttributes( previous, current );
				if ( ! delta ) {
					snapshot.set( clientId, current );
					continue;
				}

				// Remote sync of a suggestion accepted on another client:
				// when every changed attribute matches the `after` value of
				// a suggestion attached to this block, adopt the change as
				// the new baseline. Without this branch the interceptor
				// reverts the apply, and the revert round-trips back through
				// the sync layer, undoing the apply on the accepter's screen.
				if (
					isAcceptedSuggestionChange( coreSelect, current, delta )
				) {
					snapshot.set( clientId, current );
					continue;
				}

				// Capture a baseline if one isn't already set. The HOC's
				// own captureBaseline only fires for `setAttributes` calls;
				// for store-level mutations we have to seed one here.
				const overlayEntries = entriesRef.current;
				if ( ! overlayEntries[ clientId ] ) {
					const block = blockEditor.getBlock?.( clientId );
					captureBaselineRef.current(
						clientId,
						block?.name ?? '',
						previous
					);
				}

				// Route the changes into the overlay so the user still sees
				// their edit, then revert the underlying store back to the
				// snapshot so the post itself isn't actually modified. System
				// metadata is filtered out of the overlay payload — it isn't
				// a user edit, and `delta.restore` already preserves it.
				const overlayChanged = stripSystemMetadata( delta.changed );
				if ( Object.keys( overlayChanged ).length > 0 ) {
					setOverlayAttributesRef.current( clientId, overlayChanged );
				}

				isReverting = true;
				try {
					blockEditorDispatch.updateBlockAttributes(
						clientId,
						delta.restore
					);
				} finally {
					isReverting = false;
				}

				// The snapshot reflects the (now-restored) baseline for this
				// block; do NOT update it to `current` here.
			}

			// Detect blocks that disappeared from the live tree and route
			// them through the Suggest-mode "apply-and-tag" flow: re-insert
			// the subtree from the previous-tick snapshot at its previous
			// position, then tag the re-inserted block with a
			// `metadata.suggestion = { type: 'pending-remove' }` marker.
			// Auto-save reads the marker and persists it as a `block-remove`
			// operation; Apply later runs the real `removeBlock`, Reject
			// just clears the marker. See suggestions.md for the rationale.
			const removedIds = [];
			for ( const clientId of tree.blocksByClientId.keys() ) {
				if ( ! live.has( clientId ) ) {
					// "Apply landing": when another client accepts a
					// `pending-remove` suggestion, the resulting
					// `removeBlock` arrives here through sync —
					// typically batched with the marker-clearing
					// `updateBlockAttributes` into a single block-
					// editor update, which fires this subscriber
					// once. The previous-tick tree snapshot still
					// carries the pending marker, so we can recognize
					// the disappearance as the apply landing rather
					// than a fresh user delete. Adopt the removal:
					// drop the snapshot entry and skip the re-insert
					// + re-tag path. Without this, the apply bounces
					// back through sync and undoes the removal on the
					// accepting client a moment after they clicked.
					const trackedMarker =
						tree.blocksByClientId.get( clientId )?.attributes
							?.metadata?.suggestion?.type;
					if ( trackedMarker === 'pending-remove' ) {
						snapshot.delete( clientId );
						continue;
					}
					removedIds.push( clientId );
				}
			}

			if ( removedIds.length > 0 ) {
				const tops = topLevelRemoved(
					removedIds,
					tree.parentByClientId
				);

				// Phase 1: re-insert each top-level removed subtree at its
				// previous position. Done synchronously inside `isReverting`
				// so the resulting subscribe fires don't loop. The inserted
				// blocks reuse their original clientIds (preserved by
				// `getBlock`), so the marker write below targets the same
				// IDs the caller saw.
				isReverting = true;
				try {
					for ( const clientId of tops ) {
						const block = tree.blocksByClientId.get( clientId );
						const parent = tree.parentByClientId.get( clientId );
						const index = tree.indexByClientId.get( clientId );
						if ( ! block ) {
							continue;
						}
						blockEditorDispatch.insertBlock(
							block,
							index,
							parent ?? undefined,
							false
						);
					}
				} finally {
					isReverting = false;
				}

				// Phase 2: tag each re-inserted block with the pending-
				// remove marker AND record the structural operation in the
				// overlay so auto-save can persist it as a `block-remove`
				// op. `metadata.suggestion` is in SYSTEM_METADATA_KEYS, so
				// subsequent fires fold the marker into the snapshot and
				// don't route it to the user overlay.
				for ( const clientId of tops ) {
					const currentAttrs =
						blockEditor.getBlockAttributes?.( clientId );
					if ( ! currentAttrs ) {
						continue;
					}
					const block = tree.blocksByClientId.get( clientId );
					isReverting = true;
					try {
						blockEditorDispatch.updateBlockAttributes( clientId, {
							metadata: withSuggestionMarker(
								currentAttrs.metadata,
								{ type: 'pending-remove' }
							),
						} );
					} finally {
						isReverting = false;
					}
					setStructuralOpRef.current?.( clientId, block?.name ?? '', {
						type: 'block-remove',
						clientId,
						blockName: block?.name ?? '',
						block,
					} );
				}

				// Drop snapshot entries for any remaining (descendant)
				// removed blocks — they came back as part of their parent's
				// re-inserted subtree, but we still want a fresh re-seed.
				for ( const clientId of removedIds ) {
					snapshot.delete( clientId );
				}
			}

			// Refresh the tree snapshot so the next fire compares against
			// the new stable state. Done at the end of every fire whether
			// or not a removal was detected — captures inserts and moves
			// the live tree settled on during this tick.
			tree = captureTreeSnapshot( blockEditor );
		}, BLOCK_EDITOR_STORE_NAME );

		return unsubscribe;
	}, [ isSuggestMode, registry ] );

	return null;
}

export {
	diffAttributes,
	shallowAttributeEquals,
	adoptSystemMetadata,
	stripSystemMetadata,
	isAcceptedSuggestionChange,
	captureTreeSnapshot,
	topLevelRemoved,
	withSuggestionMarker,
};
