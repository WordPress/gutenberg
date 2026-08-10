import { useContext, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';
import { store as blockEditorStore } from '../../store';
import {
	globalStylesDataKey,
	globalStylesLinksDataKey,
} from '../../store/private-keys';
import { getVariationNameFromClass } from '../../hooks/block-style-variation';
import { useBlockEditContext } from '../block-edit/context';
import BlockContext from '../block-context';
import { unlock } from '../../lock-unlock';
import { isGlobalStylesInheritanceEnabled } from './inheritance';

const { resolveStyle } = unlock( globalStylesEnginePrivateApis );

// Undefined so the panels fall back to their `inheritedValue = value` default.
const NO_RESOLVED_STYLE = { value: undefined, sources: undefined };

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
 * Blocks whose heading level is handed down by a parent through block context
 * rather than held in their own `level` attribute, mapped to that context key
 * and the level they fall back to.
 *
 * Accordion Heading is the only one: the parent Accordion owns the level, and
 * the child's `level` attribute has no default and is absent on pattern-,
 * template- and paste-inserted blocks.
 */
const CONTEXT_HEADING_LEVEL_BLOCKS = {
	'core/accordion-heading': {
		contextKey: 'core/accordion-heading-level',
		fallbackLevel: 3,
	},
};

/**
 * Resolves the heading level that selects a block's `h1`-`h6` element layer.
 *
 * @param {string}  blockName      Block name.
 * @param {?number} levelAttribute The block's own `level` attribute, if it has one.
 * @param {?number} contextLevel   Level supplied by a parent through block context.
 * @return {?number} Resolved heading level, or `undefined` when the block has none.
 */
function getHeadingLevel( blockName, levelAttribute, contextLevel ) {
	const contextOwned = CONTEXT_HEADING_LEVEL_BLOCKS[ blockName ];
	if ( ! contextOwned ) {
		return levelAttribute;
	}
	// Mirrors the block's own chain (Accordion Heading saves `h${ level || 3 }`),
	// so `0` coerces to the fallback instead of reading as a level-0 state.
	return levelAttribute || contextLevel || contextOwned.fallbackLevel;
}

/**
 * Reads the heading level a parent supplies through block context.
 *
 * Only the blocks in `CONTEXT_HEADING_LEVEL_BLOCKS` read a key: the value
 * reaches every descendant, so an ordinary Heading inside an Accordion Panel
 * must not pick it up. Returns a primitive so callers can use it as a
 * `useSelect` dependency.
 *
 * @param {?string} blockName Block name.
 * @return {?number} Level from block context, or `undefined`.
 */
function useContextHeadingLevel( blockName ) {
	const blockContext = useContext( BlockContext );
	const contextKey = CONTEXT_HEADING_LEVEL_BLOCKS[ blockName ]?.contextKey;
	return contextKey ? blockContext[ contextKey ] : undefined;
}

/**
 * Maps a block to the root-level Global Styles *element* layers that paint it
 * on the canvas, in addition to (or instead of) the block's own class — e.g. a
 * Button renders `.wp-element-button`, a level-2 Heading renders `<h2>`.
 *
 * Keys are ordered low to high precedence, so a level-specific `h2` wins over
 * the generic `heading`. A level of `0` (e.g. a Site or Post Title rendered as
 * a paragraph) renders no heading tag, so no element layer applies.
 *
 * Hand-maintained by necessity: the block-to-element relationship is not
 * inferable from block metadata. `supports.color.link` and friends mark blocks
 * that *contain* an element, not blocks that *are* one, and only the inverse
 * element-to-selector map exists (`__EXPERIMENTAL_ELEMENTS`). Standardizing it
 * as a block property is tracked in
 * https://github.com/WordPress/gutenberg/issues/80438.
 *
 * Only blocks that *are* a link fold the `link` layer (e.g. Read More, Login/out
 * and the pagination links render `<a>` as their whole selves). Blocks that
 * merely *contain* a link — the heading family, Paragraph, Group, and the
 * hybrid blocks with a Link colour control (Post Author Name, Post Date, …) —
 * get no `link` layer: their inner-link control reads the
 * `inheritedValue.elements.link` passthrough instead, so folding `link` in would
 * bleed link color into the block's own text.
 *
 * @param {string}  blockName    Block name.
 * @param {?number} headingLevel Resolved heading level, from `getHeadingLevel`.
 * @return {string[]} Ordered element keys, low to high precedence.
 */
function getElementLayers( blockName, headingLevel ) {
	switch ( blockName ) {
		case 'core/button':
			return [ 'button' ];
		case 'core/accordion-heading':
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
		// Whole-block link blocks: the entire block renders as an `<a>`, so the
		// root `styles.elements.link` layer paints it, mirroring how `button`
		// paints Button. For the blocks whose `color.text` support is disabled
		// this is inert at the (hidden) text control while their typography
		// controls now reflect the link element; Read More (`color.text: true`)
		// surfaces the inherited link color at its Text control.
		case 'core/read-more':
		case 'core/loginout':
		case 'core/post-navigation-link':
		case 'core/query-pagination-next':
		case 'core/query-pagination-previous':
		case 'core/query-pagination-numbers':
		case 'core/comments-pagination-next':
		case 'core/comments-pagination-previous':
		case 'core/comments-pagination-numbers':
		case 'core/comment-edit-link':
		case 'core/comment-reply-link':
		case 'core/post-comments-link':
			return [ 'link' ];
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
	const contextHeadingLevel = useContextHeadingLevel( blockName );
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
				headingLevel: getHeadingLevel(
					blockName,
					level,
					contextHeadingLevel
				),
			};
		},
		[ blockName, className, clientId, contextHeadingLevel ]
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
		// Skip the cascade merge entirely when the experiment is off.
		if ( ! isGlobalStylesInheritanceEnabled() ) {
			return NO_RESOLVED_STYLE;
		}
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
