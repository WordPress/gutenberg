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
import { __ } from '@wordpress/i18n';
import { VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import SuggestionMoveGhost from './suggestion-move-ghost';

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
			const { clientId } = props;
			const isSuggestMode = useSelect(
				( select ) =>
					select( EDITOR_STORE_NAME ).getEditorIntent() ===
					SUGGEST_INTENT,
				[]
			);
			const isPendingInsert = useSelect(
				( select ) =>
					select( blockEditorStore )?.getBlockAttributes?.( clientId )
						?.metadata?.suggestion?.type === 'pending-insert',
				[ clientId ]
			);

			// A pending-insert block has no "before" state to preserve — the
			// block itself is the suggestion. Edits to it write through to
			// the real attributes (skipping the overlay) so the content
			// syncs via CRDT and renders on the reviewer's canvas as part
			// of the preview, instead of being trapped in the suggester's
			// local overlay.
			if ( ! isSuggestMode || isPendingInsert ) {
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
 *
 * The attribute "bracket" is suggest-mode-only — it represents the suggester's
 * uncommitted edits living in the local overlay, which other intents have no
 * way to interact with. Structural markers, by contrast, are persisted on the
 * live block (synced through the same path as block content), so reviewers in
 * Edit or View intent see and can act on them too — that's the visual cue a
 * post author needs to spot a pending removal/insertion/move at a glance.
 */
const withSuggestionBlockClassName = createHigherOrderComponent(
	( BlockListBlock ) =>
		function BlockListBlockWithSuggestionClass( props ) {
			const { clientId } = props;
			const { entries, moveGhosts } = useSuggestionOverlay();
			const ghostsAfter = moveGhosts?.after?.get( clientId );
			const ghostsBefore = moveGhosts?.before?.get( clientId );
			const hasGhosts =
				( ghostsAfter && ghostsAfter.length > 0 ) ||
				( ghostsBefore && ghostsBefore.length > 0 );
			const { isSuggestMode, structuralClass, authorId } = useSelect(
				( select ) => {
					const editor = select( EDITOR_STORE_NAME );
					const blockEditor = select( blockEditorStore );
					const marker =
						blockEditor?.getBlockAttributes?.( clientId )?.metadata
							?.suggestion;
					return {
						isSuggestMode:
							editor.getEditorIntent() === SUGGEST_INTENT,
						structuralClass: structuralMarkerClass( marker?.type ),
						authorId: marker?.authorId ?? null,
					};
				},
				[ clientId ]
			);
			const entry = entries[ clientId ];
			const hasPendingOverlay =
				!! entry &&
				Object.keys( entry.overlayAttributes ?? {} ).length > 0;
			const showOverlayBracket = isSuggestMode && hasPendingOverlay;
			const isPendingMove =
				structuralClass === 'is-suggestion-pending-move';

			if ( ! showOverlayBracket && ! structuralClass && ! hasGhosts ) {
				return <BlockListBlock { ...props } />;
			}

			const renderGhosts = ( list, keyPrefix ) =>
				list?.map( ( moved ) => (
					<SuggestionMoveGhost
						key={ `${ keyPrefix }-${ moved.clientId }` }
						moved={ moved }
					/>
				) );

			// Apply the suggester's avatar color via a CSS custom property
			// so the canvas treatment (outline / strikethrough / label tab)
			// reads as that suggester's. Falls through to the green default
			// in CSS when `authorId` is missing.
			const wrapperStyle =
				authorId !== null
					? {
							...props.wrapperProps?.style,
							'--suggestion-author-color':
								getAvatarBorderColor( authorId ),
					  }
					: props.wrapperProps?.style;

			const blockClassName =
				showOverlayBracket || structuralClass
					? clsx(
							props.className,
							showOverlayBracket && 'is-suggestion-pending',
							structuralClass
					  )
					: props.className;

			return (
				<>
					{ renderGhosts( ghostsBefore, 'gb' ) }
					{ isPendingMove && (
						<VisuallyHidden>
							{ __( 'Suggested move destination.' ) }
						</VisuallyHidden>
					) }
					<BlockListBlock
						{ ...props }
						className={ blockClassName }
						wrapperProps={ {
							...props.wrapperProps,
							style: wrapperStyle,
							// Localized text for the CSS-rendered "Suggested
							// move" tab (see content-suggestion.scss); sighted
							// users in any locale read it from this attribute.
							...( isPendingMove && {
								'data-suggestion-move-label':
									__( 'Suggested move' ),
							} ),
						} }
					/>
					{ renderGhosts( ghostsAfter, 'ga' ) }
				</>
			);
		},
	'withSuggestionBlockClassName'
);

export { structuralMarkerClass, withSuggestionBlockClassName };

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
