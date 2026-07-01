/**
 * Suggest-mode overlay HOC.
 *
 * With inline markers (Option B) as the primary suggestion surface, this HOC
 * covers the edits that markers don't: primitive attribute changes (heading
 * level, alignment) and the rare content edit the marker path can't resolve
 * unambiguously. Those route through `wrappedSetAttributes` into the overlay,
 * a per-block store of the clean proposed value that auto-save reads to build
 * the suggestion's operations. The block-editor store stays at the baseline
 * until Accept/Reject, so the document is never mutated in place.
 *
 * Text and formatting edits never reach the overlay: typing, deletion, cut,
 * and single-line paste are caught on `beforeinput`/`cut`/`paste` by the
 * suggestion keyboards, and the remaining seams (committed IME composition,
 * autocorrect, drag-drop, multi-line paste, format toggles) are diverted to
 * inline markers by `maybeHandleFormatEdit` / `maybeHandleContentEdit` before
 * the overlay path runs. See #77867 for the original overlay tradeoff and
 * #73411 for the marker migration.
 */

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
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import SuggestionMoveGhost from './suggestion-move-ghost';
import useMoveGhosts from './use-move-ghosts';
import { planFormatMarkers, planEditMarkers } from '../inline-suggestions';

/**
 * True for plain strings and for objects that stringify to a meaningful HTML
 * form (the rich-text package's `RichTextData` is the case we care about).
 * Duck-typed against `toString` rather than `instanceof RichTextData` so we
 * don't take a hard dependency on the rich-text package's internal class.
 *
 * @param {*} value Candidate attribute value.
 * @return {boolean} True when `String( value )` will produce useful HTML.
 */
function isStringLike( value ) {
	if ( typeof value === 'string' ) {
		return true;
	}
	return (
		value !== null &&
		value !== undefined &&
		typeof value.toString === 'function' &&
		value.toString !== Object.prototype.toString
	);
}

/**
 * Attribute keys whose values are known to be object-valued and therefore
 * need a one-level-deep merge so the overlay preserves untouched fields.
 * Other attributes are replaced wholesale (which matches `setAttributes`
 * semantics for primitive and array values).
 */
const DEEP_MERGE_KEYS = new Set( [ 'style', 'metadata' ] );

/**
 * Apply an overlay attribute set on top of the block's real attributes for
 * rendering. Keys in `DEEP_MERGE_KEYS` (currently `style` and `metadata`)
 * are one-level-merged so a partial overlay payload — e.g. tweaking
 * `style.color` while leaving `style.typography` alone — preserves the
 * untouched fields. Every other key is replaced wholesale, matching
 * `setAttributes` semantics for primitive and array values.
 *
 * @param {Object}      base    Block's real attributes from the block-editor store.
 * @param {Object|null} overlay Pending overlay attributes; `null` is a no-op.
 * @return {Object} Merged attributes for rendering. Returns `base` by reference
 * when there is no overlay to apply, so React's prop-identity bail-out fires.
 */
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
	const {
		entries,
		captureBaseline,
		setOverlayAttributes,
		requestFormatSuggestion,
		requestContentSuggestion,
	} = useSuggestionOverlay();

	// Track the latest attributes via a ref so the wrapped `setAttributes`
	// callback stays stable across renders. `useRef` seeds it with the initial
	// value, and this effect keeps it in sync after each commit so the callback
	// reads the current attributes without listing them as a dependency.
	const attributesRef = useRef( attributes );
	useEffect( () => {
		attributesRef.current = attributes;
	}, [ attributes ] );

	const overlayEntry = entries[ clientId ];
	const overlayAttributes = overlayEntry?.overlayAttributes ?? null;

	// The suggester's user id, forwarded to `maybeHandleContentEdit` so a
	// reconciled text edit opens its note under the right author. Defaults to
	// `null` for anonymous / pre-collab edits.
	const { authorId } = useSelect( ( select ) => {
		const core = select( coreStore );
		return { authorId: core?.getCurrentUser?.()?.id ?? null };
	}, [] );

	// Does an overlay entry currently exist for this block? This is the
	// source of truth; `captureBaseline` only creates an entry when there
	// isn't one, so we can skip the dispatch when we already know there is.
	// Relying on a local ref was fragile — it didn't reset after the entry
	// was cleared (auto-save trash, orphan prune, intent-switch).
	const entryExists = !! overlayEntry;

	// Detect a formatting-only edit (bold/italic/link toggled over a run, the
	// text unchanged) and hand it to the single-mount format handler, which
	// creates the note and writes a `format` marker to the live block instead
	// of routing the edit into the overlay diff. A format toggle arrives here
	// as a fresh `content` value with no earlier DOM event to intercept
	// (unlike typing, which the addition keyboard catches on `beforeinput`),
	// so this per-block `setAttributes` seam is the one point that covers every
	// source — toolbar button, keyboard shortcut, and the link popover alike.
	// Returns true only when the handler took ownership; with no handler
	// registered (isolated unit tests) it returns false and the edit falls
	// through to the overlay path.
	const maybeHandleFormatEdit = useCallback(
		( nextAttributes, prevAttributes ) => {
			if (
				! nextAttributes ||
				! Object.prototype.hasOwnProperty.call(
					nextAttributes,
					'content'
				)
			) {
				return false;
			}
			const prevContent = prevAttributes?.content;
			const nextContent = nextAttributes.content;
			if (
				! isStringLike( prevContent ) ||
				! isStringLike( nextContent )
			) {
				return false;
			}
			const plan = planFormatMarkers( prevContent, nextContent );
			if ( plan.kind !== 'format' ) {
				return false;
			}
			return requestFormatSuggestion( {
				clientId,
				blockName: name,
				nextContent,
				plan,
			} );
		},
		[ clientId, name, requestFormatSuggestion ]
	);

	// Detect a text edit that reaches the block as a whole new `content` value
	// with no `beforeinput` for the typing/deletion keyboards to catch (a
	// committed IME composition, autocorrect, drag-drop, multi-line paste) and
	// hand it to the single-mount content reconciler, which turns it into inline
	// markers instead of an overlay diff. Only plans this converter can fully
	// execute — every action opens a fresh note (`insert-add`/`wrap-del`) — are
	// handed off; edits that grow or remove an existing marker, or that the diff
	// can't resolve unambiguously, return false and fall through to the overlay
	// path below. Returns true only when the reconciler took ownership; with no
	// handler registered (isolated unit tests) `requestContentSuggestion` returns
	// false and the edit falls through.
	const maybeHandleContentEdit = useCallback(
		( nextAttributes, prevAttributes ) => {
			if (
				! nextAttributes ||
				! Object.prototype.hasOwnProperty.call(
					nextAttributes,
					'content'
				)
			) {
				return false;
			}
			const prevContent = prevAttributes?.content;
			const nextContent = nextAttributes.content;
			if (
				! isStringLike( prevContent ) ||
				! isStringLike( nextContent )
			) {
				return false;
			}
			const plan = planEditMarkers( prevContent, nextContent, {
				authorId,
			} );
			const actions = plan?.actions ?? [];
			if ( actions.length === 0 ) {
				return false;
			}
			if ( ! actions.every( ( action ) => action.newNote ) ) {
				return false;
			}
			return requestContentSuggestion( {
				clientId,
				blockName: name,
				prevContent,
				plan,
			} );
		},
		[ clientId, name, authorId, requestContentSuggestion ]
	);

	const wrappedSetAttributes = useCallback(
		( nextAttributes ) => {
			// A formatting-only change becomes a live `format` marker rather
			// than an overlay diff; everything else (text edits, primitive
			// attribute changes) still routes to the overlay below.
			// The block-editor store holds the live value RichText renders (a
			// format-suggestion block keeps no overlay entry), so the block's
			// current attributes are the "before" side of the format diff.
			if (
				maybeHandleFormatEdit( nextAttributes, attributesRef.current )
			) {
				return;
			}
			// A text edit that surfaced as a fresh `content` value (not caught
			// by the typing/deletion keyboards) becomes inline markers too, so
			// it never reaches the overlay diff path.
			if (
				maybeHandleContentEdit( nextAttributes, attributesRef.current )
			) {
				return;
			}
			// First overlay write for this block snapshots the current
			// attributes as the baseline; subsequent writes only record
			// overlay deltas. This lets the diff renderer below compare
			// "what the block looked like when the suggestion started"
			// against "what the suggester is proposing now".
			if ( ! entryExists ) {
				captureBaseline( clientId, name, attributesRef.current );
			}
			setOverlayAttributes( clientId, nextAttributes );
		},
		[
			clientId,
			name,
			captureBaseline,
			setOverlayAttributes,
			entryExists,
			maybeHandleFormatEdit,
			maybeHandleContentEdit,
		]
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
			const { entries } = useSuggestionOverlay();
			const moveGhosts = useMoveGhosts();
			const ghostsAfter = moveGhosts?.after?.get( clientId );
			const ghostsBefore = moveGhosts?.before?.get( clientId );
			const ghostsInside = moveGhosts?.insideParent?.get( clientId );
			const hasGhosts =
				( ghostsAfter && ghostsAfter.length > 0 ) ||
				( ghostsBefore && ghostsBefore.length > 0 ) ||
				( ghostsInside && ghostsInside.length > 0 );
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
					{ /* Ghosts for blocks that left this (now-empty) container,
					     rendered just below it since there's no surviving
					     child to anchor them to inside. */ }
					{ renderGhosts( ghostsInside, 'gi' ) }
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
