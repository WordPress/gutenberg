/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import {
	globalStylesDataKey,
	globalStylesLinksDataKey,
} from '../../store/private-keys';
import { resolveStyles } from './build-inherited-value';
import { getVariationNameFromClass } from '../../hooks/block-style-variation';

/**
 * Internal hook that reads the Global Styles payload and the block's
 * registered styles, and returns the wrapped `{ styles }` shape the builder
 * and ref-resolver helpers expect, along with the theme-file `_links` map used
 * to resolve theme-file pointers (e.g. background images) and the block's
 * registered styles (used for variation titles in breadcrumb tooltips).
 *
 * @param {?string} blockName Selected block name (e.g. `core/heading`).
 * @return {{ globalStyles: ?Object, links: ?Object, blockStyles: Array }} Wrapped Global Styles payload, links map, and block styles.
 */
function useRawGlobalStyles( blockName ) {
	const { rawGlobalStylesData, links, blockStyles } = useSelect(
		( select ) => {
			const settings = select( blockEditorStore ).getSettings();
			const blockStylesSelector = select( blocksStore ).getBlockStyles;
			return {
				rawGlobalStylesData: settings[ globalStylesDataKey ] ?? null,
				links: settings[ globalStylesLinksDataKey ] ?? null,
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
	return { globalStyles, links, blockStyles };
}

/**
 * Internal hook that derives the active block-style-variation slug from a
 * block's `className` by matching registered styles via
 * `getVariationNameFromClass`. Returns `null` when no registered variation
 * class is present (the most common case).
 *
 * The lookup is scoped to a single `useSelect` subscription; the
 * `@wordpress/blocks` registered-styles slice changes only when a block's
 * styles are (un)registered, so this subscription is cold in steady-state
 * editor use.
 *
 * @param {?string} blockName Block name (e.g. `core/heading`).
 * @param {?string} className Space-separated class string from block attributes.
 * @return {?string} Variation slug (without the `is-style-` prefix) or `null`.
 */
function useOwnVariation( blockName, className ) {
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

/**
 * Hook: computes the merged, cascade-resolved `inheritedValue` payload and
 * source map for a selected block, ready to hand to a shared Global Styles
 * panel via props.
 *
 * It reads the merged Global Styles payload and the block's applied variation,
 * then folds the Root ‹ Block-type ‹ applied-variation cascade (resolving
 * `{ ref }` envelopes and theme-file pointers) in the pure `resolveStyles`
 * builder. All store access lives here; the panels stay presentational.
 *
 * Before the `globalStylesDataKey` payload settles (hydration) or when
 * `blockName` is missing, the hook returns empty value and source objects, so
 * each panel's `inheritedValue = value` default preserves pre-feature behavior.
 *
 * @param {?string} blockName       Selected block name (e.g. `core/heading`).
 * @param {?string} className       Block `className` used to detect an applied variation.
 * @param {?Object} [selectedState] Selected block style state (`{ viewport, pseudo }`), or null for the default state.
 * @return {{ value: Object, sources: Object }} Merged panel-scoped payload and source map.
 */
export function useResolvedStyles(
	blockName,
	className,
	selectedState = null
) {
	const ownVariation = useOwnVariation( blockName, className );
	const { globalStyles, links, blockStyles } =
		useRawGlobalStyles( blockName );

	return useMemo( () => {
		if ( ! blockName ) {
			return { value: {}, sources: {} };
		}
		return resolveStyles( {
			blockName,
			ownVariation,
			globalStyles,
			blockStyles,
			selectedState,
			_links: links,
		} );
	}, [
		blockName,
		ownVariation,
		globalStyles,
		blockStyles,
		selectedState,
		links,
	] );
}
