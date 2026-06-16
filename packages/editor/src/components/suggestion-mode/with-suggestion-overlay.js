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
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';
import { markContentDiff, stripSuggestionMarks } from './inline-formats';
import { getAvatarBorderColor } from '../collab-sidebar/utils';

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
 * Compare the rich-text attributes of two attribute objects for stringwise
 * equality. Used to detect divergence between the suggester's recorded
 * baseline and the reviewer's current real-block content: when they no
 * longer match, the hydrated overlay is no longer applicable and the merge
 * step must be skipped. Missing values on both sides count as equal so a
 * block with no `content` attribute doesn't trigger divergence on every
 * render.
 *
 * @param {Object|null} a First attribute set.
 * @param {Object|null} b Second attribute set.
 * @return {boolean} True when every key in `RICH_TEXT_ATTRIBUTE_KEYS`
 * stringifies to the same value in both, including the both-missing case.
 */
function richTextAttributesMatch( a, b ) {
	if ( ! a || ! b ) {
		return false;
	}
	for ( const key of RICH_TEXT_ATTRIBUTE_KEYS ) {
		const aHas = Object.prototype.hasOwnProperty.call( a, key );
		const bHas = Object.prototype.hasOwnProperty.call( b, key );
		if ( ! aHas && ! bHas ) {
			continue;
		}
		if ( aHas !== bHas ) {
			return false;
		}
		const av = a[ key ];
		const bv = b[ key ];
		if ( av === bv ) {
			continue;
		}
		if ( ! isStringLike( av ) || ! isStringLike( bv ) ) {
			return false;
		}
		if ( String( av ) !== String( bv ) ) {
			return false;
		}
	}
	return true;
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
 * Inner renderer that owns the suggestion overlay hooks. Mounted when the
 * editor is in `suggest` intent or when the hydrator has seeded a read-only
 * overlay entry for this block (reviewer / post-reload). Splitting the
 * outer pass-through HOC from this inner component keeps the overlay's
 * context lookup, refs, and memoized merge out of the render path on
 * blocks the suggestion system has nothing to say about — a noticeable win
 * on large documents.
 *
 * @param {Object}                        args               Arguments.
 * @param {import('react').ComponentType} args.BlockEdit     Wrapped edit component.
 * @param {Object}                        args.props         Props to forward to `BlockEdit`.
 * @param {boolean}                       args.isSuggestMode True when the editor is in Suggest
 *                                                           intent; routes writes into the
 *                                                           overlay. Otherwise the wrap is
 *                                                           render-only and writes go straight
 *                                                           to the real block.
 */
function SuggestingBlockEdit( { BlockEdit, props, isSuggestMode } ) {
	const {
		clientId,
		name,
		attributes,
		setAttributes: realSetAttributes,
	} = props;
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
	// Hydrator-seeded entries on reviewers (not the suggester) need a
	// divergence guard. The overlay's recorded baseline is the suggester's
	// `before` value. Once the real block content moves away from that
	// baseline — either because the reviewer is typing locally or because
	// CRDT synced inbound changes from a concurrent editor — the merge
	// step would overwrite the reviewer's text with the suggester's stale
	// `after` and the diff renderer would visually attribute the divergence
	// to the suggester. The reviewer would see their own writes vanish and
	// the suggester's name attached to text they never wrote. Skip the
	// merge in that case; the existing `hasAttributeConflict` flow in
	// `provider.js` will prompt on accept.
	const isHydratedReviewerView =
		! isSuggestMode && !! overlayEntry?.hydratedFromCommentId;

	// Id of the user the inline marks should be attributed to. A
	// hydrator-seeded entry carries the original suggester's `authorId`, so a
	// reviewer (or the suggester after a reload) sees the suggestion tinted
	// with its author's color rather than whoever is currently viewing. For a
	// live suggest-mode edit there is no seeded author and the current user is
	// the suggester, so we fall back to `getCurrentUser()` below.
	const seededAuthorId = overlayEntry?.authorId ?? null;

	// Whether this block is the currently selected one (skip marking while
	// the user is typing into it) and the current user's id (used to tint a
	// live suggester's own in-progress marks). Folded into a single
	// `useSelect` so the HOC stays at one extra store-subscription per block.
	// `isSelected` defaults to `true` so any environment without the
	// block-editor store registered (unit tests of this HOC) skips marking
	// too — production always has both stores.
	const { isSelected, currentUserId } = useSelect(
		( select ) => {
			const blockEditor = select( BLOCK_EDITOR_STORE_NAME );
			const core = select( coreStore );
			return {
				isSelected: blockEditor?.isBlockSelected
					? blockEditor.isBlockSelected( clientId )
					: true,
				currentUserId: core?.getCurrentUser?.()?.id ?? null,
			};
		},
		[ clientId ]
	);

	// Prefer the seeded suggestion author; fall back to the current user for
	// live edits. `authorColor` is `null` for anonymous / pre-collab edits,
	// in which case the canvas CSS falls through to the red/green pair.
	const authorId = seededAuthorId ?? currentUserId;
	const authorColor =
		authorId !== null ? getAvatarBorderColor( authorId ) : null;

	// Does an overlay entry currently exist for this block? This is the
	// source of truth; `captureBaseline` only creates an entry when there
	// isn't one, so we can skip the dispatch when we already know there is.
	// Relying on a local ref was fragile — it didn't reset after the entry
	// was cleared (auto-save trash, orphan prune, intent-switch).
	const entryExists = !! overlayEntry;

	const wrappedSetAttributes = useCallback(
		( nextAttributes ) => {
			// Reviewer / non-suggest intent (the block is only being wrapped
			// because the hydrator seeded an entry from a persisted
			// suggestion comment): writes go straight to the real block.
			// The reviewer's edit is not part of the original suggester's
			// proposal, so it shouldn't be captured into the overlay.
			if ( ! isSuggestMode ) {
				realSetAttributes( nextAttributes );
				return;
			}
			// First overlay write for this block snapshots the current
			// attributes as the baseline; subsequent writes only record
			// overlay deltas. This lets the diff renderer below compare
			// "what the block looked like when the suggestion started"
			// against "what the suggester is proposing now".
			//
			// TODO(#79220): the overlay is keyed only by `clientId`, so when a
			// second author edits a block that already carries another
			// author's hydrated suggestion, `entryExists` is true and this
			// write merges into that author's entry rather than forking a new,
			// correctly-attributed suggestion. Supporting concurrent
			// per-author suggestions on one block requires re-keying the
			// overlay; tracked separately.
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
		[
			clientId,
			name,
			captureBaseline,
			setOverlayAttributes,
			entryExists,
			isSuggestMode,
			realSetAttributes,
		]
	);

	const mergedAttributes = useMemo( () => {
		// Reviewer view of a hydrated entry: only merge + mark while the
		// real block's rich-text content still matches the suggester's
		// recorded baseline. Once they diverge, render the real content
		// unchanged so the reviewer's writes (or RTC-synced changes) stay
		// visible and aren't visually attributed to the suggester.
		if (
			isHydratedReviewerView &&
			! richTextAttributesMatch( attributes, baselineAttributes )
		) {
			return attributes;
		}
		const merged = mergeOverlayAttributes( attributes, overlayAttributes );
		// While the block is selected, hand back the plain proposed value
		// so the user's caret doesn't fight RichText's value-prop
		// reconciliation when marks are swapped in mid-edit. Round-tripping
		// marked HTML through RichText can land the caret inside a `<del>`
		// or at the start of an `<ins>`, which then turns the next
		// keystroke into a stripped/reversed insertion. Marks reappear as
		// soon as focus moves off the block.
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
		isHydratedReviewerView,
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
			// Wrap blocks that have an overlay entry too, not just those
			// being edited in Suggest intent. The hydrator seeds entries
			// from persisted suggestion comments so a reviewer (or the
			// suggester after a reload) can see inline diff marks for any
			// pending suggestion without having to re-enter Suggest intent.
			// `wrappedSetAttributes` routes the reviewer's writes through
			// to the real block, so this wrap is render-only for them.
			const { entries } = useSuggestionOverlay();
			const hasOverlayEntry = !! entries[ clientId ];

			if ( ! isSuggestMode && ! hasOverlayEntry ) {
				return <BlockEdit { ...props } />;
			}

			return (
				<SuggestingBlockEdit
					BlockEdit={ BlockEdit }
					props={ props }
					isSuggestMode={ isSuggestMode }
				/>
			);
		},
	'withSuggestionOverlay'
);

/**
 * HOC that tags the rendered block list item with a class whenever it has a
 * pending suggestion overlay. The class is the hook for the "bracket"
 * styling that makes edited blocks discoverable without relying on the
 * block toolbar being visible.
 */
const withSuggestionBlockClassName = createHigherOrderComponent(
	( BlockListBlock ) =>
		function BlockListBlockWithSuggestionClass( props ) {
			const { clientId } = props;
			const { entries } = useSuggestionOverlay();
			const isSuggestMode = useSelect(
				( select ) =>
					select( EDITOR_STORE_NAME ).getEditorIntent() ===
					SUGGEST_INTENT,
				[]
			);
			const entry = entries[ clientId ];
			const hasPendingOverlay =
				!! entry &&
				Object.keys( entry.overlayAttributes ?? {} ).length > 0;

			if ( ! isSuggestMode || ! hasPendingOverlay ) {
				return <BlockListBlock { ...props } />;
			}

			return (
				<BlockListBlock
					{ ...props }
					className={ clsx(
						props.className,
						'is-suggestion-pending'
					) }
				/>
			);
		},
	'withSuggestionBlockClassName'
);

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
