/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
} from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import {
	globalStylesDataKey,
	pushStylesToGlobalStylesKey,
} from '../../store/private-keys';
import { buildInheritedValueWithSourcesMemoized } from './build-inherited-value';
import { getVariationNameFromClass } from '../../hooks/block-style-variation';
import { getValueFromObjectPath } from '../../utils/object';

const DEFAULT_STYLE_STATE_VALUE = 'default';

/**
 * Returns true when the selected block style state is the default (i.e. not a
 * viewport- or pseudo-scoped state).
 *
 * Inlined rather than imported from `hooks/block-style-state` to keep this
 * context module off that file's heavier dependency chain.
 *
 * @param {?Object} selectedState Selected block style state (`{ viewport, pseudo }`).
 * @return {boolean} Whether the default state is selected.
 */
function isDefaultStyleState( selectedState ) {
	const viewport = selectedState?.viewport;
	const pseudo = selectedState?.pseudo;
	return (
		( ! viewport || viewport === DEFAULT_STYLE_STATE_VALUE ) &&
		( ! pseudo || pseudo === DEFAULT_STYLE_STATE_VALUE )
	);
}

/**
 * Builds the Global Styles destination path for an individual pushed override.
 *
 * Overrides made while a block style variation is active are written to that
 * variation's Global Styles location, so "Make default" updates the default the
 * user is actually editing rather than the block's base default.
 *
 * @param {string}   blockName    Block name (e.g. `core/heading`).
 * @param {?string}  ownVariation Active block style variation slug, if any.
 * @param {string[]} stylePath    Path relative to the block's style object
 *                                (e.g. `[ 'typography', 'fontSize' ]`).
 * @return {string[]} Path relative to the Global Styles `styles` object.
 */
export function getPushDestinationPath( blockName, ownVariation, stylePath ) {
	const blockPath = ownVariation
		? [ 'blocks', blockName, 'variations', ownVariation ]
		: [ 'blocks', blockName ];
	return [ ...blockPath, ...stylePath ];
}

/**
 * React context carrying the block-level inputs required to build a
 * panel-scoped `inheritedValue` payload. The Provider collapses the
 * `useSelect` subscription to one per mount, so individual panels do not
 * each re-subscribe to the `globalStylesDataKey` settings slice.
 *
 * `null` means "no Provider above this panel"; the consumer hook then
 * returns an empty object and each panel preserves its existing behavior.
 *
 * @type {React.Context<?{ globalStyles: ?Object, blockName: ?string, ownVariation: ?string, blockStyles: ?Array, pushIndividualStyle: ?Function, canPushToGlobalStyles: boolean }>}
 */
export const InheritedValueContext = createContext( null );

/**
 * Provider component. Reads the Global Styles payload once via
 * `useSelect` and propagates it alongside the selected block's
 * `blockName` and `ownVariation` to every descendant panel.
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
	const { rawGlobalStylesData, blockStyles, pushStylesToGlobalStyles } =
		useSelect(
			( select ) => {
				const settings = select( blockEditorStore ).getSettings();
				const blockStylesSelector =
					select( blocksStore ).getBlockStyles;
				return {
					rawGlobalStylesData:
						settings[ globalStylesDataKey ] ?? null,
					pushStylesToGlobalStyles:
						settings[ pushStylesToGlobalStylesKey ] ?? null,
					blockStyles:
						blockName && blockStylesSelector
							? blockStylesSelector( blockName )
							: [],
				};
			},
			[ blockName ]
		);
	const globalStyles = useMemo(
		() => ( rawGlobalStylesData ? { styles: rawGlobalStylesData } : null ),
		[ rawGlobalStylesData ]
	);

	// Pushing an individual override to Global Styles only makes sense for the
	// default block style state; viewport/pseudo states are scoped overrides
	// that don't map onto a block's base Global Styles location.
	const canPushToGlobalStyles =
		!! pushStylesToGlobalStyles &&
		!! blockName &&
		isDefaultStyleState( selectedState );

	/**
	 * Promotes a single local style override to the block's Global Styles,
	 * or to the active variation's Global Styles when a variation is being
	 * edited (see {@link getPushDestinationPath}).
	 *
	 * @param {string[]} stylePath Path relative to the block's style object
	 *                             (e.g. `[ 'typography', 'fontSize' ]` or
	 *                             `[ 'elements', 'link', 'color', 'text' ]`).
	 * @param {*}        value     Local value to promote.
	 */
	const pushIndividualStyle = useCallback(
		( stylePath, value ) => {
			if ( ! pushStylesToGlobalStyles || ! blockName ) {
				return;
			}
			pushStylesToGlobalStyles(
				getPushDestinationPath( blockName, ownVariation, stylePath ),
				value
			);
		},
		[ pushStylesToGlobalStyles, blockName, ownVariation ]
	);

	const contextValue = useMemo(
		() => ( {
			globalStyles,
			blockName: blockName ?? null,
			ownVariation,
			blockStyles,
			selectedState: selectedState ?? null,
			canPushToGlobalStyles,
			pushIndividualStyle,
		} ),
		[
			globalStyles,
			blockName,
			ownVariation,
			blockStyles,
			selectedState,
			canPushToGlobalStyles,
			pushIndividualStyle,
		]
	);
	return (
		<InheritedValueContext.Provider value={ contextValue }>
			{ children }
		</InheritedValueContext.Provider>
	);
}

/**
 * Hook: returns the merged `inheritedValue` payload and source map for a
 * panel. Call once per panel, passing the element tag (if any) the panel
 * folds.
 *
 * Before the Provider is mounted, or during hydration before the
 * `globalStylesDataKey` payload settles, the hook returns empty value and
 * source objects. Each panel's existing `inheritedValue = value` default
 * then keeps pre-feature behavior after bridge components pass `.value`.
 *
 * The returned object identity is stable across renders when none of
 * `(globalStyles, blockName, element, ownVariation)` have changed.
 *
 * @param {Object}  [args]
 * @param {?string} [args.element] Element tag to fold (e.g. `h2`, `link`).
 * @return {{ value: Object, sources: Object }} Merged panel-scoped payload and source map.
 */
export function useInheritedValue( { element = null } = {} ) {
	const ctx = useContext( InheritedValueContext );
	return useMemo( () => {
		if ( ! ctx || ! ctx.blockName ) {
			return { value: {}, sources: {} };
		}
		return buildInheritedValueWithSourcesMemoized( {
			blockName: ctx.blockName,
			element,
			ownVariation: ctx.ownVariation,
			globalStyles: ctx.globalStyles,
			blockStyles: ctx.blockStyles,
			selectedState: ctx.selectedState,
		} );
	}, [ ctx, element ] );
}

/**
 * Hook: exposes the "push individual style to Global Styles" capability for the
 * current block context. Panels call this to promote a single local override
 * to Global Styles from the local-override dropdown.
 *
 * Returns `canPush: false` and a no-op when no Provider is mounted (e.g. the
 * Global Styles sidebar itself) or when a non-default block style state is
 * selected, so callers can omit the action gracefully.
 *
 * @return {{ canPush: boolean, pushIndividualStyle: Function }} Push helpers.
 */
export function usePushIndividualStyleToGlobalStyles() {
	const ctx = useContext( InheritedValueContext );
	return useMemo(
		() => ( {
			canPush: !! ctx?.canPushToGlobalStyles,
			pushIndividualStyle: ctx?.pushIndividualStyle ?? ( () => {} ),
		} ),
		[ ctx ]
	);
}

/**
 * Hook: exposes the block context that determines where "Make default" writes,
 * so the local-override dropdown can describe the destination to the user.
 *
 * The destination mirrors {@link getPushDestinationPath}: the current block,
 * plus the active variation when one is being edited. Returns empty/null values
 * when no Provider is mounted.
 *
 * @return {{ blockName: ?string, ownVariation: ?string, blockStyles: Array }} Destination context.
 */
export function usePushDestination() {
	const ctx = useContext( InheritedValueContext );
	return useMemo(
		() => ( {
			blockName: ctx?.blockName ?? null,
			ownVariation: ctx?.ownVariation ?? null,
			blockStyles: ctx?.blockStyles ?? [],
		} ),
		[ ctx ]
	);
}

/**
 * Hook: returns a factory that builds per-control "Make default"
 * handlers for a panel. Call once per panel, passing the panel's local
 * `value` object, then call the returned factory per control.
 *
 * The factory returns `undefined` when pushing isn't available (no Provider,
 * non-default block style state, or no local value at any of the supplied
 * paths), so a control can spread the result straight onto its
 * `onPushToGlobalStyles` prop and the menu item is omitted automatically.
 *
 * Each handler promotes every defined local value found at `paths` to Global
 * Styles, then runs the control's existing `onReset` so the now-redundant
 * local override is cleared and the control falls back to the (just pushed)
 * inherited value.
 *
 * @param {Object} value Panel-scoped local style object.
 * @return {(paths: string[][], onReset?: Function) => (Function|undefined)} Handler factory.
 */
export function useStylePushHandlers( value ) {
	const { canPush, pushIndividualStyle } =
		usePushIndividualStyleToGlobalStyles();
	return useCallback(
		( paths, onReset ) => {
			if ( ! canPush ) {
				return undefined;
			}
			const definedPaths = paths.filter(
				( path ) => getValueFromObjectPath( value, path ) !== undefined
			);
			if ( definedPaths.length === 0 ) {
				return undefined;
			}
			return () => {
				definedPaths.forEach( ( path ) => {
					pushIndividualStyle(
						path,
						getValueFromObjectPath( value, path )
					);
				} );
				onReset?.();
			};
		},
		[ canPush, pushIndividualStyle, value ]
	);
}

export function useInheritedStyleValue( {
	blockName,
	element = null,
	ownVariation = null,
	selectedState = null,
} ) {
	const { rawGlobalStylesData, blockStyles } = useSelect(
		( select ) => {
			const settings = select( blockEditorStore ).getSettings();
			const blockStylesSelector = select( blocksStore ).getBlockStyles;
			return {
				rawGlobalStylesData: settings[ globalStylesDataKey ] ?? null,
				blockStyles:
					blockName && blockStylesSelector
						? blockStylesSelector( blockName )
						: [],
			};
		},
		[ blockName ]
	);
	const globalStyles = useMemo(
		() => ( rawGlobalStylesData ? { styles: rawGlobalStylesData } : null ),
		[ rawGlobalStylesData ]
	);

	return useMemo( () => {
		if ( ! blockName ) {
			return { value: {}, sources: {} };
		}
		return buildInheritedValueWithSourcesMemoized( {
			blockName,
			element,
			ownVariation,
			globalStyles,
			blockStyles,
			selectedState,
		} );
	}, [
		blockName,
		element,
		ownVariation,
		globalStyles,
		blockStyles,
		selectedState,
	] );
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
