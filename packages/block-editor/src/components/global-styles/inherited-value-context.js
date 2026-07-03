/**
 * WordPress dependencies
 */
import { createContext, useContext, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { globalStylesDataKey } from '../../store/private-keys';
import { buildInheritedValue } from './build-inherited-value';
import { getVariationNameFromClass } from '../../hooks/block-style-variation';

/**
 * React context carrying the block-level inputs required to build a
 * panel-scoped `inheritedValue` payload. The Provider collapses the
 * `useSelect` subscription to one per mount, so individual panels do not
 * each re-subscribe to the `globalStylesDataKey` settings slice.
 *
 * `null` means "no Provider above this panel"; the consumer hook then
 * returns an empty object and each panel preserves its existing behavior.
 *
 * @type {React.Context<?{ globalStyles: ?Object, blockName: ?string, ownVariation: ?string }>}
 */
export const InheritedValueContext = createContext( null );

/**
 * Internal hook that reads the Global Styles payload and returns the wrapped
 * `{ styles }` shape the builder and ref-resolver helpers expect. Shared by
 * `InheritedValueProvider` (inspector) and `useInheritedStyleValue` (canvas).
 *
 * @return {{ globalStyles: ?Object }} Wrapped Global Styles payload.
 */
function useRawGlobalStyles() {
	const rawGlobalStylesData = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return settings[ globalStylesDataKey ] ?? null;
	}, [] );
	const globalStyles = useMemo(
		() => ( rawGlobalStylesData ? { styles: rawGlobalStylesData } : null ),
		[ rawGlobalStylesData ]
	);
	return { globalStyles };
}

/**
 * Provider component. Reads the Global Styles payload and passes it down,
 * along with the selected block's `blockName` and `ownVariation`, to every
 * panel below it.
 *
 * The settings value is the bare merged styles tree, so the Provider wraps it
 * as `{ styles: rawGlobalStylesData }` before passing it to the builder and
 * ref-resolver helpers.
 *
 * @param {Object}  props
 * @param {?string} props.blockName       Selected block name (e.g. `core/heading`).
 * @param {?string} [props.ownVariation]  Detected variation slug (see `getVariationNameFromClass`).
 * @param {?Object} [props.selectedState] Selected block style state (`{ viewport, pseudo }`), or null for the default state.
 * @param {*}       props.children
 */
export function InheritedValueProvider( {
	blockName,
	ownVariation = null,
	selectedState = null,
	children,
} ) {
	const { globalStyles } = useRawGlobalStyles();

	const contextValue = useMemo(
		() => ( {
			globalStyles,
			blockName: blockName ?? null,
			ownVariation,
			selectedState: selectedState ?? null,
		} ),
		[ globalStyles, blockName, ownVariation, selectedState ]
	);
	return (
		<InheritedValueContext.Provider value={ contextValue }>
			{ children }
		</InheritedValueContext.Provider>
	);
}

/**
 * Hook: returns the merged `inheritedValue` payload and source map for a
 * panel. Call once per panel.
 *
 * Before the Provider is mounted, or during hydration before the
 * `globalStylesDataKey` payload settles, the hook returns empty value and
 * source objects. Each panel's existing `inheritedValue = value` default
 * then keeps pre-feature behavior after bridge components pass `.value`.
 *
 * The returned object identity is stable across renders when none of
 * `(globalStyles, blockName, ownVariation)` have changed.
 *
 * @return {{ value: Object, sources: Object }} Merged panel-scoped payload and source map.
 */
export function useInheritedValue() {
	const ctx = useContext( InheritedValueContext );
	return useMemo( () => {
		if ( ! ctx || ! ctx.blockName ) {
			return { value: {}, sources: {} };
		}
		return buildInheritedValue( {
			blockName: ctx.blockName,
			ownVariation: ctx.ownVariation,
			globalStyles: ctx.globalStyles,
			selectedState: ctx.selectedState,
		} );
	}, [ ctx ] );
}

export function useInheritedStyleValue( {
	blockName,
	ownVariation = null,
	selectedState = null,
} ) {
	const { globalStyles } = useRawGlobalStyles();

	return useMemo( () => {
		if ( ! blockName ) {
			return { value: {}, sources: {} };
		}
		return buildInheritedValue( {
			blockName,
			ownVariation,
			globalStyles,
			selectedState,
		} );
	}, [ blockName, ownVariation, globalStyles, selectedState ] );
}

/**
 * Hook: derives the active block-style-variation slug from a block's
 * `className` by matching registered styles via
 * `getVariationNameFromClass`. Returns `null` when no registered
 * variation class is present (the most common case).
 *
 * Intended to be called by each inspector panel's hook wrapper
 * (e.g. `hooks/typography.js`, `hooks/color.js`) so the derived slug
 * can be passed to `<InheritedValueProvider ownVariation={...}>`. The
 * lookup is scoped to a single `useSelect` subscription per call; the
 * `@wordpress/blocks` registered-styles slice changes only when a
 * block's styles are (un)registered, so this subscription is cold in
 * steady-state editor use.
 *
 * @param {?string} blockName Block name (e.g. `core/heading`).
 * @param {?string} className Space-separated class string from block attributes.
 * @return {?string} Variation slug (without the `is-style-` prefix) or `null`.
 */
export function useOwnVariation( blockName, className ) {
	return useSelect(
		( select ) => {
			if ( ! blockName || ! className ) {
				return null;
			}
			const registeredStyles =
				select( blocksStore ).getBlockStyles( blockName );
			return getVariationNameFromClass( className, registeredStyles );
		},
		[ blockName, className ]
	);
}
