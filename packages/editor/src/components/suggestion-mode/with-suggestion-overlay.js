/**
 * Suggest-mode overlay HOC.
 *
 * Data flow while the editor is in `suggest` intent:
 *
 *   BlockEdit
 *     └─ wrappedSetAttributes        ── strip suggestion marks RichText
 *                                       round-tripped from a previous
 *                                       render, then store the *clean*
 *                                       proposed value in the overlay
 *        └─ overlay (proposed clean)
 *           └─ SuggestingBlockEdit   ── merge baseline + overlay
 *              └─ markContentDiff    ── compute marked HTML on each render
 *                 └─ BlockEdit       ── render with deletions/additions visible
 *
 * The block-editor store stays at the baseline value the entire time the
 * suggestion is open; only the rendered `attributes` prop carries the
 * marked diff, gated on `! isBlockSelected` so RichText's caret is not
 * disrupted while the user is typing into the block. Accept/Reject runs
 * against the clean overlay value via the existing `attribute-set` path —
 * no marked-value persistence, no schema migration. See #77867 for the
 * tradeoff vs. edit-time interception.
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
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';
import { markContentDiff, stripSuggestionMarks } from './inline-formats';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import SuggestionMoveGhost from './suggestion-move-ghost';

const BLOCK_EDITOR_STORE_NAME = 'core/block-editor';

/**
 * Block attribute keys whose values are RichText content and therefore
 * benefit from inline diff marking. Marking primitive attributes like
 * `align: 'left'` would leak `<del>left</del><ins>right</ins>` into a
 * className/string slot, so this set is intentionally narrow. Most of the
 * golden-path scenarios this PR covers (paragraph text edits, heading
 * text edits, bolding a word) live on the `content` attribute; richer
 * block coverage lands in subsequent phases.
 */
const RICH_TEXT_ATTRIBUTE_KEYS = new Set( [ 'content' ] );

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
 * Walk the merged attribute set and replace each rich-text value with its
 * baseline-vs-proposed marked diff. Skips attributes whose value matches
 * the baseline (no change to mark) or whose baseline is missing (the
 * suggestion has nothing to diff against).
 *
 * `authorColor` is forwarded to `markContentDiff` so each `<del>`/`<ins>`
 * carries the suggester's avatar color as an inline custom property; the
 * canvas CSS partial consumes the variable and falls back to the
 * red/green default when this is null.
 *
 * @param {Object}      merged        Output of `mergeOverlayAttributes`.
 * @param {Object}      baseline      Baseline attributes captured when the
 *                                    suggestion began.
 * @param {string|null} [authorColor] Optional suggester avatar color.
 * @return {Object} `merged` with rich-text attributes replaced by marked
 * HTML, or `merged` unchanged when nothing was eligible.
 */
function applyDiffMarks( merged, baseline, authorColor = null ) {
	if ( ! merged || ! baseline ) {
		return merged;
	}
	let result = null;
	for ( const key of RICH_TEXT_ATTRIBUTE_KEYS ) {
		if ( ! Object.prototype.hasOwnProperty.call( merged, key ) ) {
			continue;
		}
		const proposed = merged[ key ];
		const original = baseline[ key ];
		if ( ! isStringLike( proposed ) || ! isStringLike( original ) ) {
			continue;
		}
		const proposedStr = String( proposed );
		const originalStr = String( original );
		if ( proposedStr === originalStr ) {
			continue;
		}
		if ( ! result ) {
			result = { ...merged };
		}
		result[ key ] = markContentDiff(
			originalStr,
			proposedStr,
			authorColor
		);
	}
	return result ?? merged;
}

/**
 * Strip suggestion marks from incoming `setAttributes` payloads. RichText
 * round-trips its `value` prop through serialization on every keystroke,
 * so a previously-marked render would otherwise come back into the overlay
 * as marked HTML and the next mark pass would double up. Stripping at the
 * intercept keeps the overlay holding the "proposed" value rather than the
 * marked rendering.
 *
 * @param {Object} nextAttributes Incoming attribute payload.
 * @return {Object} Payload with rich-text values normalized.
 */
function stripMarksFromIncoming( nextAttributes ) {
	if ( ! nextAttributes ) {
		return nextAttributes;
	}
	let result = null;
	for ( const key of RICH_TEXT_ATTRIBUTE_KEYS ) {
		if ( ! Object.prototype.hasOwnProperty.call( nextAttributes, key ) ) {
			continue;
		}
		const value = nextAttributes[ key ];
		if ( ! isStringLike( value ) ) {
			continue;
		}
		const stripped = stripSuggestionMarks( String( value ) );
		if ( stripped === String( value ) ) {
			continue;
		}
		if ( ! result ) {
			result = { ...nextAttributes };
		}
		result[ key ] = stripped;
	}
	return result ?? nextAttributes;
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
	const { entries, captureBaseline, setOverlayAttributes } =
		useSuggestionOverlay();

	// Track the latest attributes via a ref so the wrapped `setAttributes`
	// callback remains stable. Blocks sometimes invoke `setAttributes` from
	// effects keyed on this reference.
	const attributesRef = useRef( attributes );
	attributesRef.current = attributes;

	const overlayEntry = entries[ clientId ];
	const overlayAttributes = overlayEntry?.overlayAttributes ?? null;
	const baselineAttributes = overlayEntry?.baselineAttributes ?? null;

	// Whether this block is the currently selected one (skip marking while
	// the user is typing into it) and the suggester's avatar color (paints
	// the inline marks so two suggesters' edits read as different colors).
	// Folded into a single `useSelect` so the HOC stays at one extra
	// store-subscription per block in suggest mode. `isSelected` defaults
	// to `true` so any environment without the block-editor store
	// registered (unit tests of this HOC) skips marking too — production
	// always has both stores. `authorColor` defaults to `null` for
	// anonymous / pre-collab edits, in which case the canvas CSS falls
	// through to the red/green pair.
	const { isSelected, authorColor } = useSelect(
		( select ) => {
			const blockEditor = select( BLOCK_EDITOR_STORE_NAME );
			const core = select( coreStore );
			const userId = core?.getCurrentUser?.()?.id ?? null;
			return {
				isSelected: blockEditor?.isBlockSelected
					? blockEditor.isBlockSelected( clientId )
					: true,
				authorColor:
					userId !== null ? getAvatarBorderColor( userId ) : null,
			};
		},
		[ clientId ]
	);

	// Does an overlay entry currently exist for this block? This is the
	// source of truth; `captureBaseline` only creates an entry when there
	// isn't one, so we can skip the dispatch when we already know there is.
	// Relying on a local ref was fragile — it didn't reset after the entry
	// was cleared (auto-save trash, orphan prune, intent-switch).
	const entryExists = !! overlayEntry;

	const wrappedSetAttributes = useCallback(
		( nextAttributes ) => {
			// First overlay write for this block snapshots the current
			// attributes as the baseline; subsequent writes only record
			// overlay deltas. This lets the diff renderer below compare
			// "what the block looked like when the suggestion started"
			// against "what the suggester is proposing now".
			if ( ! entryExists ) {
				captureBaseline( clientId, name, attributesRef.current );
			}
			// Strip any suggestion marks RichText round-tripped from a
			// previously marked render before storing in the overlay; see
			// `stripMarksFromIncoming` for the rationale.
			setOverlayAttributes(
				clientId,
				stripMarksFromIncoming( nextAttributes )
			);
		},
		[ clientId, name, captureBaseline, setOverlayAttributes, entryExists ]
	);

	const mergedAttributes = useMemo( () => {
		const merged = mergeOverlayAttributes( attributes, overlayAttributes );
		// While the block is selected, hand back the plain proposed value so
		// the user's caret doesn't fight RichText's value-prop reconciliation
		// on every keystroke. The marks reappear as soon as focus moves away
		// — see the `isSelected` `useSelect` above for the full rationale.
		if ( isSelected ) {
			return merged;
		}
		return applyDiffMarks( merged, baselineAttributes, authorColor );
	}, [
		attributes,
		overlayAttributes,
		baselineAttributes,
		isSelected,
		authorColor,
	] );

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

export { mergeOverlayAttributes, applyDiffMarks, stripMarksFromIncoming };
export default withSuggestionOverlay;
