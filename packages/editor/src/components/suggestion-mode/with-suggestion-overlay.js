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

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { EDITOR_STORE_NAME, SUGGEST_INTENT } from './constants';
import { markContentDiff, stripSuggestionMarks } from './inline-formats';

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

function isStringLike( value ) {
	if ( typeof value === 'string' ) {
		return true;
	}
	// `RichTextData` is an object that stringifies to its HTML form; check
	// for a usable `toString` rather than instanceof so we don't take a
	// hard dependency on the rich-text package's internal class.
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
 * @param {Object} merged   Output of `mergeOverlayAttributes`.
 * @param {Object} baseline Baseline attributes captured when the suggestion
 *                          began.
 * @return {Object} `merged` with rich-text attributes replaced by marked
 * HTML, or `merged` unchanged when nothing was eligible.
 */
function applyDiffMarks( merged, baseline ) {
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
		result[ key ] = markContentDiff( originalStr, proposedStr );
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

	// Whether this block is the currently selected one. While selected, we
	// skip applying inline diff marks so RichText's value-prop reconciliation
	// doesn't fight the user's caret on every keystroke. Marks reappear as
	// soon as the user clicks/tabs away. Defaults to `true` so any
	// environment without the block-editor store registered (unit tests of
	// this HOC) skips marking too — production always has the store.
	const isSelected = useSelect(
		( select ) => {
			const blockEditor = select( BLOCK_EDITOR_STORE_NAME );
			if ( ! blockEditor?.isBlockSelected ) {
				return true;
			}
			return blockEditor.isBlockSelected( clientId );
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
		if ( isSelected ) {
			return merged;
		}
		return applyDiffMarks( merged, baselineAttributes );
	}, [ attributes, overlayAttributes, baselineAttributes, isSelected ] );

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
