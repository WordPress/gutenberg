/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { EDITOR_STORE_NAME } from './constants';

/**
 * Attribute keys whose values are known to be object-valued and therefore
 * need a one-level-deep merge so the overlay preserves untouched fields.
 * Other attributes are replaced wholesale (which matches `setAttributes`
 * semantics for primitive and array values).
 */
const DEEP_MERGE_KEYS = new Set( [ 'style', 'metadata' ] );

function mergeOverlayAttributes( base, overlay ) {
	if ( ! overlay ) {
		return base;
	}
	const merged = { ...base };
	for ( const [ key, value ] of Object.entries( overlay ) ) {
		if (
			DEEP_MERGE_KEYS.has( key ) &&
			value &&
			typeof value === 'object' &&
			! Array.isArray( value ) &&
			merged[ key ] &&
			typeof merged[ key ] === 'object' &&
			! Array.isArray( merged[ key ] )
		) {
			merged[ key ] = { ...merged[ key ], ...value };
		} else {
			merged[ key ] = value;
		}
	}
	return merged;
}

/**
 * HOC that diverts block edits to the suggestion overlay when the editor is
 * in the `suggest` intent. The block's real attributes are never mutated;
 * overlay attributes are merged into the `attributes` prop for rendering so
 * the user sees their in-progress change, but the block-editor store stays
 * at the baseline until the suggestion is committed.
 *
 * In any other intent the HOC is a pass-through.
 */
const withSuggestionOverlay = createHigherOrderComponent(
	( BlockEdit ) =>
		function BlockEditWithSuggestionOverlay( props ) {
			// `setAttributes` is intentionally ignored when the intent is
			// `suggest` — edits are captured in the overlay instead of being
			// written back to the block-editor store.
			const { clientId, name, attributes } = props;
			const isSuggestMode = useSelect(
				( select ) =>
					select( EDITOR_STORE_NAME ).getEditorIntent?.() ===
					'suggest',
				[]
			);

			const { entries, captureBaseline, setOverlayAttributes } =
				useSuggestionOverlay();

			// Track the latest attributes via a ref so the wrapped
			// `setAttributes` callback remains stable. Blocks sometimes
			// invoke `setAttributes` from effects keyed on this reference.
			const attributesRef = useRef( attributes );
			attributesRef.current = attributes;

			// Gate `captureBaseline` behind a local ref so the reducer only
			// sees a baseline action once per block lifetime, avoiding a
			// wasted dispatch on every keystroke.
			const baselineCapturedRef = useRef( false );

			const overlayAttributes =
				entries[ clientId ]?.overlayAttributes ?? null;

			const wrappedSetAttributes = useCallback(
				( nextAttributes ) => {
					if ( ! baselineCapturedRef.current ) {
						captureBaseline(
							clientId,
							name,
							attributesRef.current
						);
						baselineCapturedRef.current = true;
					}
					setOverlayAttributes( clientId, nextAttributes );
				},
				[ clientId, name, captureBaseline, setOverlayAttributes ]
			);

			const mergedAttributes = useMemo(
				() => mergeOverlayAttributes( attributes, overlayAttributes ),
				[ attributes, overlayAttributes ]
			);

			if ( ! isSuggestMode ) {
				return <BlockEdit { ...props } />;
			}

			return (
				<BlockEdit
					{ ...props }
					attributes={ mergedAttributes }
					setAttributes={ wrappedSetAttributes }
				/>
			);
		},
	'withSuggestionOverlay'
);

let filterRegistered = false;

/**
 * Register the overlay filter. Idempotent — safe to call multiple times
 * (hot reload, dynamic imports).
 */
export function registerSuggestionOverlayFilter() {
	if ( filterRegistered ) {
		return;
	}
	filterRegistered = true;
	addFilter(
		'editor.BlockEdit',
		'core/editor/suggestion-mode-overlay',
		withSuggestionOverlay
	);
}

export { mergeOverlayAttributes };
export default withSuggestionOverlay;
