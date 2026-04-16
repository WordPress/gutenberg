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

// The editor store is referenced by its registered name rather than being
// imported directly to avoid a module cycle between this file, the editor
// store, and the provider (which mounts `SuggestionOverlayProvider`).
const EDITOR_STORE_NAME = 'core/editor';

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

			const overlayAttributes =
				entries[ clientId ]?.overlayAttributes ?? null;

			const wrappedSetAttributes = useCallback(
				( nextAttributes ) => {
					// Lazily capture the baseline on first edit so we only
					// track blocks the user actually touched.
					captureBaseline( clientId, name, attributesRef.current );
					setOverlayAttributes( clientId, nextAttributes );
				},
				[ clientId, name, captureBaseline, setOverlayAttributes ]
			);

			const mergedAttributes = useMemo( () => {
				if ( ! overlayAttributes ) {
					return attributes;
				}
				return { ...attributes, ...overlayAttributes };
			}, [ attributes, overlayAttributes ] );

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

/**
 * Register the overlay filter. Idempotent — safe to import multiple times.
 */
export function registerSuggestionOverlayFilter() {
	addFilter(
		'editor.BlockEdit',
		'core/editor/suggestion-mode-overlay',
		withSuggestionOverlay
	);
}

export default withSuggestionOverlay;
