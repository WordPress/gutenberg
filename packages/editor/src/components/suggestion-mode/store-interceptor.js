/**
 * WordPress dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';

const BLOCK_EDITOR_STORE_NAME = 'core/block-editor';

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
	if ( typeof a !== 'object' || typeof b !== 'object' ) {
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
	const { entries, captureBaseline, setOverlayAttributes } =
		useSuggestionOverlay();
	const registry = useRegistry();

	const isSuggestMode = useSelect(
		( select ) =>
			select( EDITOR_STORE_NAME ).getEditorIntent() === SUGGEST_INTENT,
		[]
	);

	// Mutable references read from inside the subscribe callback. Using refs
	// avoids resubscribing on every entries / overlay change.
	const entriesRef = useRef( entries );
	entriesRef.current = entries;

	const captureBaselineRef = useRef( captureBaseline );
	captureBaselineRef.current = captureBaseline;

	const setOverlayAttributesRef = useRef( setOverlayAttributes );
	setOverlayAttributesRef.current = setOverlayAttributes;

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
				const previous = snapshot.get( clientId );
				const current = blockEditor.getBlockAttributes( clientId );

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

				const delta = diffAttributes( previous, current );
				if ( ! delta ) {
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
				// snapshot so the post itself isn't actually modified.
				setOverlayAttributesRef.current( clientId, delta.changed );

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

			// Drop snapshot entries for blocks that were removed.
			if ( snapshot.size > liveClientIds.length ) {
				for ( const clientId of snapshot.keys() ) {
					if ( ! live.has( clientId ) ) {
						snapshot.delete( clientId );
					}
				}
			}
		}, BLOCK_EDITOR_STORE_NAME );

		return unsubscribe;
	}, [ isSuggestMode, registry ] );

	return null;
}

export { diffAttributes, shallowAttributeEquals };
