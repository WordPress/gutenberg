/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import {
	globalStylesDataKey,
	globalStylesLinksDataKey,
} from '../../store/private-keys';
import { getVariationNameFromClass } from '../../hooks/block-style-variation';
import { unlock } from '../../lock-unlock';

const { resolveStyle } = unlock( globalStylesEnginePrivateApis );

/**
 * Reads the Global Styles payload and returns it as a `GlobalStylesConfig`
 * (`{ styles, _links }`), the shape `resolveStyle` expects. `_links` carries
 * the theme-file map used to resolve pointers such as background images.
 *
 * @return {?Object} Global Styles config, or `null` before the payload settles.
 */
function useRawGlobalStyles() {
	const { rawGlobalStylesData, links } = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return {
			rawGlobalStylesData: settings[ globalStylesDataKey ] ?? null,
			links: settings[ globalStylesLinksDataKey ] ?? null,
		};
	}, [] );
	return useMemo(
		() =>
			rawGlobalStylesData
				? { styles: rawGlobalStylesData, _links: links ?? undefined }
				: null,
		[ rawGlobalStylesData, links ]
	);
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
 * `{ ref }` envelopes and theme-file pointers) via the pure `resolveStyle`
 * resolver in `@wordpress/global-styles-engine`. All store access lives here;
 * the panels stay presentational.
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
export function useResolvedStyle( blockName, className, selectedState = null ) {
	const variationName = useOwnVariation( blockName, className );
	const globalStyles = useRawGlobalStyles();

	return useMemo( () => {
		if ( ! blockName ) {
			return { value: {}, sources: {} };
		}
		return resolveStyle( globalStyles, {
			blockName,
			variationName,
			viewport: selectedState?.viewport ?? null,
			pseudoState: selectedState?.pseudo ?? null,
		} );
	}, [ blockName, variationName, globalStyles, selectedState ] );
}
