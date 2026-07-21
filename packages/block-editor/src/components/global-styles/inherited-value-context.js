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
import { useBlockEditContext } from '../block-edit/context';
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
 * Maps a block to the root-level Global Styles *element* layers that paint it
 * on the canvas, in addition to (or instead of) the block's own class — e.g. a
 * Button renders `.wp-element-button`, a level-2 Heading renders `<h2>`.
 *
 * Element keys are returned ordered low to high precedence, so a level-specific
 * `h2` correctly wins over the generic `heading`. A level of `0` (e.g. a Site
 * or Post Title rendered as a paragraph) renders no heading tag at all, so
 * neither `heading` nor any `h1`-`h6` styles reach the block and no element
 * layer applies.
 *
 * This list is hand-maintained by necessity: the block-to-element relationship
 * is not inferable from block metadata. `supports.color.link` and friends mark
 * blocks that *contain* a stylable element, not blocks that *are* one (Button
 * declares no `color.button`, Heading no `color.heading`), and the system only
 * stores the inverse element-to-selector map (`__EXPERIMENTAL_ELEMENTS`); the
 * correspondence otherwise lives only in each block's rendered markup.
 * Standardizing it as a declarative block property is tracked in
 * https://github.com/WordPress/gutenberg/issues/80438.
 *
 * The link-bearing heading blocks (Site Title, Post Title, Term Name) are
 * deliberately not given a `link` layer here: their inner-link color control
 * reads the `inheritedValue.elements.link` passthrough, so folding `link` into
 * the block's own layers would bleed link color into the heading's text.
 *
 * @param {string}  blockName    Block name.
 * @param {?number} headingLevel Block's `level` attribute, when it has one.
 * @return {string[]} Ordered element keys, low to high precedence.
 */
function getElementLayers( blockName, headingLevel ) {
	switch ( blockName ) {
		case 'core/button':
			return [ 'button' ];
		case 'core/heading':
		case 'core/post-title':
		case 'core/site-title':
		case 'core/query-title':
		case 'core/comments-title':
		case 'core/term-name':
		case 'core/site-tagline':
			if ( headingLevel === 0 ) {
				return [];
			}
			return headingLevel
				? [ 'heading', `h${ headingLevel }` ]
				: [ 'heading' ];
		default:
			return [];
	}
}

/**
 * Internal hook that derives the active block-style-variation slug from a
 * block's `className` by matching registered styles via
 * `getVariationNameFromClass`, together with the element layers that paint
 * the block. Both come from a single store subscription.
 *
 * The lookup is scoped to a single `useSelect` subscription; the
 * `@wordpress/blocks` registered-styles slice changes only when a block's
 * styles are (un)registered, so this subscription is cold in steady-state
 * editor use.
 *
 * The block's `clientId` comes from the block edit context rather than an
 * argument: these panels always render inside `BlockEditContextProvider`, so
 * the caller does not have to thread it through.
 *
 * @param {?string} blockName Block name (e.g. `core/heading`).
 * @param {?string} className Space-separated class string from block attributes.
 * @return {{ variationName: ?string, headingLevel: ?number }} Variation slug
 * (without the `is-style-` prefix) and the block's heading level, if any.
 */
function useVariationAndElements( blockName, className ) {
	const { clientId } = useBlockEditContext();
	return useSelect(
		( select ) => {
			if ( ! blockName ) {
				return { variationName: null, headingLevel: undefined };
			}
			const registeredStyles =
				select( blocksStore ).getBlockStyles( blockName );
			const { level } =
				select( blockEditorStore ).getBlockAttributes( clientId ) || {};
			// Primitives only: `useSelect` shallow-compares this object, so
			// returning a fresh array here would re-render on every action.
			return {
				variationName: className
					? getVariationNameFromClass( className, registeredStyles )
					: null,
				headingLevel: level,
			};
		},
		[ blockName, className, clientId ]
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
	const { variationName, headingLevel } = useVariationAndElements(
		blockName,
		className
	);
	const globalStyles = useRawGlobalStyles();

	return useMemo( () => {
		if ( ! blockName ) {
			return { value: {}, sources: {} };
		}
		return resolveStyle( globalStyles, {
			blockName,
			variationName,
			elements: getElementLayers( blockName, headingLevel ),
			viewport: selectedState?.viewport ?? null,
			pseudoState: selectedState?.pseudo ?? null,
		} );
	}, [
		blockName,
		variationName,
		headingLevel,
		globalStyles,
		selectedState,
	] );
}
