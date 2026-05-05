/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';

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
 * Inner renderer that owns the suggestion overlay hooks. Only mounted when
 * the editor is in `suggest` intent, so the overlay's context lookup,
 * refs, and memoized merge don't run on every `BlockEdit` render for every
 * block across the entire editor when suggestions are inactive. This split
 * matters for large documents — in Edit/View intent the outer wrapper
 * executes a single `useSelect` and renders the original `BlockEdit`
 * untouched.
 *
 * @param {Object}                        args           Arguments.
 * @param {import('react').ComponentType} args.BlockEdit Wrapped edit component.
 * @param {Object}                        args.props     Props to forward to `BlockEdit`.
 */
function SuggestingBlockEdit( { BlockEdit, props } ) {
	const { clientId, name, attributes } = props;
	const { entries, captureBaseline, setOverlayAttributes } =
		useSuggestionOverlay();

	// Track the latest attributes via a ref so the wrapped `setAttributes`
	// callback remains stable. Blocks sometimes invoke `setAttributes` from
	// effects keyed on this reference.
	const attributesRef = useRef( attributes );
	attributesRef.current = attributes;

	const overlayAttributes = entries[ clientId ]?.overlayAttributes ?? null;

	// Does an overlay entry currently exist for this block? This is the
	// source of truth; `captureBaseline` only creates an entry when there
	// isn't one, so we can skip the dispatch when we already know there is.
	// Relying on a local ref was fragile — it didn't reset after the entry
	// was cleared (auto-save trash, orphan prune, intent-switch).
	const entryExists = !! entries[ clientId ];

	const wrappedSetAttributes = useCallback(
		( nextAttributes ) => {
			if ( ! entryExists ) {
				captureBaseline( clientId, name, attributesRef.current );
			}
			setOverlayAttributes( clientId, nextAttributes );
		},
		[ clientId, name, captureBaseline, setOverlayAttributes, entryExists ]
	);

	const mergedAttributes = useMemo(
		() => mergeOverlayAttributes( attributes, overlayAttributes ),
		[ attributes, overlayAttributes ]
	);

	return (
		<BlockEdit
			{ ...props }
			attributes={ mergedAttributes }
			setAttributes={ wrappedSetAttributes }
		/>
	);
}

/**
 * HOC that diverts block edits to the suggestion overlay when the editor is
 * in the `suggest` intent. The block's real attributes are never mutated;
 * overlay attributes are merged into the `attributes` prop for rendering so
 * the user sees their in-progress change, but the block-editor store stays
 * at the baseline until the suggestion is committed.
 *
 * In any other intent the HOC is a pass-through and adds only a single
 * `useSelect` call per block.
 */
const withSuggestionOverlay = createHigherOrderComponent(
	( BlockEdit ) =>
		function BlockEditWithSuggestionOverlay( props ) {
			const isSuggestMode = useSelect(
				( select ) =>
					select( EDITOR_STORE_NAME ).getEditorIntent() ===
					SUGGEST_INTENT,
				[]
			);

			if ( ! isSuggestMode ) {
				return <BlockEdit { ...props } />;
			}

			return (
				<SuggestingBlockEdit BlockEdit={ BlockEdit } props={ props } />
			);
		},
	'withSuggestionOverlay'
);

/**
 * Map a `metadata.suggestion.type` marker to the class that drives the
 * structural-suggestion visual treatment. Keeps the marker → class lookup
 * in one place so the rendering layer stays a thin shell over the data
 * model.
 *
 * @param {string|undefined} type Marker type.
 * @return {string|null} Class name for the marker, or null when the type
 * is not a recognized structural marker.
 */
function structuralMarkerClass( type ) {
	switch ( type ) {
		case 'pending-remove':
			return 'is-suggestion-pending-remove';
		case 'pending-insert':
			return 'is-suggestion-pending-insert';
		case 'pending-move':
			return 'is-suggestion-pending-move';
		default:
			return null;
	}
}

/**
 * HOC that tags the rendered block list item with a class whenever it has a
 * pending suggestion — either an attribute overlay (renders the green
 * "bracket" treatment) or a structural marker stored in
 * `metadata.suggestion` (renders strikethrough/dim/move overlays).
 */
const withSuggestionBlockClassName = createHigherOrderComponent(
	( BlockListBlock ) =>
		function BlockListBlockWithSuggestionClass( props ) {
			const { clientId } = props;
			const { entries } = useSuggestionOverlay();
			const { isSuggestMode, structuralClass } = useSelect(
				( select ) => {
					const editor = select( EDITOR_STORE_NAME );
					const blockEditor = select( blockEditorStore );
					return {
						isSuggestMode:
							editor.getEditorIntent() === SUGGEST_INTENT,
						structuralClass: structuralMarkerClass(
							blockEditor?.getBlockAttributes?.( clientId )
								?.metadata?.suggestion?.type
						),
					};
				},
				[ clientId ]
			);
			const entry = entries[ clientId ];
			const hasPendingOverlay =
				!! entry &&
				Object.keys( entry.overlayAttributes ?? {} ).length > 0;

			if (
				! isSuggestMode ||
				( ! hasPendingOverlay && ! structuralClass )
			) {
				return <BlockListBlock { ...props } />;
			}

			return (
				<BlockListBlock
					{ ...props }
					className={ clsx(
						props.className,
						hasPendingOverlay && 'is-suggestion-pending',
						structuralClass
					) }
				/>
			);
		},
	'withSuggestionBlockClassName'
);

export { structuralMarkerClass };

let filterRegistered = false;

/**
 * Register the overlay filters. Idempotent — safe to call multiple times
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
	addFilter(
		'editor.BlockListBlock',
		'core/editor/suggestion-mode-block-class',
		withSuggestionBlockClassName
	);
}

export { mergeOverlayAttributes };
export default withSuggestionOverlay;
