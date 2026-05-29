/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	hasBlockSupport,
	getBlockSupport,
	store as blocksStore,
} from '@wordpress/blocks';
import { __experimentalHasSplitBorders as hasSplitBorders } from '@wordpress/components';
import { Platform, useCallback, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getColorClassName } from '../components/colors';
import InspectorControls from '../components/inspector-controls';
import useMultipleOriginColorsAndGradients from '../components/colors-gradients/use-multiple-origin-colors-and-gradients';
import {
	cleanEmptyObject,
	shouldSkipSerialization,
	useBlockSettings,
} from './utils';
import {
	useHasBorderPanel,
	useHasBorderPanelControls,
	BorderPanel as StylesBorderPanel,
} from '../components/global-styles';
import { store as blockEditorStore } from '../store';
import { globalStylesDataKey } from '../store/private-keys';
import { getVariationNameFromClass } from './block-style-variation';

export const BORDER_SUPPORT_KEY = '__experimentalBorder';
export const SHADOW_SUPPORT_KEY = 'shadow';

const BORDER_SIDES = [ 'top', 'right', 'bottom', 'left' ];

/**
 * Map from border side to the camelCased React inline-style key. Used by the
 * render-time fallback to emit `borderTopStyle`, `borderRightStyle`, etc.
 */
const BORDER_SIDE_TO_STYLE_KEY = {
	top: 'borderTopStyle',
	right: 'borderRightStyle',
	bottom: 'borderBottomStyle',
	left: 'borderLeftStyle',
};

/**
 * Border `style` values that are "non-rendering" — they intentionally hide
 * the border even when `color` and `width` are set. Treating these as
 * inherited would suppress the fallback when a user adds a color on a block
 * whose theme cascade sets `style: 'none'`, leaving the user's color
 * invisible. Excluding them lets the fallback emit `solid` so the user's
 * action remains visible.
 */
const NON_RENDERING_BORDER_STYLES = new Set( [ 'none', 'hidden' ] );

const hasRenderingStyle = ( style ) =>
	!! style && ! NON_RENDERING_BORDER_STYLES.has( style );

/**
 * Determines whether a border `style` value is being inherited from the
 * resolved global styles for a given block instance.
 *
 * Inheritance is checked across two cascade levels — the block type's global
 * styles, and the active block style variation — at two scopes each: the
 * `border.style` shorthand, and any of the per-side `border.{side}.style`
 * values. A shorthand inherited style is considered to cover every side.
 *
 * Root-level `styles.border.style` is intentionally excluded: theme.json's
 * root border styles compile to a `body` selector, and `border-style` is not
 * a CSS-inherited property, so a root border style does not cascade to inner
 * block borders. Treating it as inherited would suppress the fallback even
 * when no border style actually applies to the block.
 *
 * Mirrors the PHP helper `gutenberg_get_inherited_border_styles` in
 * `lib/block-supports/border.php`. Keep the two implementations in sync.
 *
 * @param {Object} blockBorder     Border subtree from
 *                                 `globalStyles.styles.blocks[ name ].border`.
 * @param {Object} variationBorder Border subtree from the active variation,
 *                                 if any.
 *
 * @return {{shorthand: boolean, top: boolean, right: boolean, bottom: boolean, left: boolean}}
 *         Whether an inherited border style applies to the shorthand and to
 *         each side.
 */
export function getInheritedBorderStyles( blockBorder, variationBorder ) {
	const shorthand =
		hasRenderingStyle( blockBorder?.style ) ||
		hasRenderingStyle( variationBorder?.style );

	const result = { shorthand };
	BORDER_SIDES.forEach( ( side ) => {
		result[ side ] =
			shorthand ||
			hasRenderingStyle( blockBorder?.[ side ]?.style ) ||
			hasRenderingStyle( variationBorder?.[ side ]?.style );
	} );
	return result;
}

/**
 * Returns a new border value with `style: 'solid'` filled in where the user
 * has set a `color` or `width` without an explicit `style` AND no inherited
 * global border style applies for that scope.
 *
 * Replaces the legacy `:where([style*="border-color"]) { border-style: solid }`
 * CSS fallback in `common.scss`, which produced false positives on inline
 * styles whose values merely contained `border-color`/`border-width` (e.g.
 * custom-property declarations or `background-image: url(…border…)`).
 *
 * Handles flat, split, and mixed shapes uniformly: the shorthand and each
 * per-side subtree are evaluated independently. `BorderBoxControl` does not
 * currently emit mixed shapes but this helper is exported and may be called
 * from other contexts; keeping the logic shape-agnostic avoids surprises.
 *
 * @param {Object|undefined} newBorder Border object emitted by BorderBoxControl.
 * @param {Object}           inherited Inheritance flags from
 *                                     {@link getInheritedBorderStyles}.
 *
 * @return {Object|undefined} Border value with style defaults applied.
 */
export function applyBorderStyleDefaults( newBorder, inherited ) {
	if ( ! newBorder ) {
		return newBorder;
	}

	const updated = { ...newBorder };
	const isSplit = hasSplitBorders( newBorder );

	// Per-side defaults. Iterating regardless of shape lets mixed shapes
	// (a shorthand value alongside per-side overrides) be handled cleanly.
	BORDER_SIDES.forEach( ( side ) => {
		const sideBorder = updated[ side ];
		if (
			sideBorder &&
			! sideBorder.style &&
			( sideBorder.color || sideBorder.width ) &&
			! inherited?.[ side ]
		) {
			updated[ side ] = { ...sideBorder, style: 'solid' };
		}
	} );

	// Shorthand default. Skipped for pure split inputs to preserve the
	// existing convention that split borders never carry a shorthand style.
	if (
		! isSplit &&
		! updated.style &&
		( updated.color || updated.width ) &&
		! inherited?.shorthand
	) {
		updated.style = 'solid';
	}

	return updated;
}

/**
 * Render-time backward-compatibility fallback. For blocks that already have
 * saved attributes referencing a border `color` or `width` without a `style`
 * — e.g. content saved before the editor-time default was introduced — this
 * returns the per-side inline CSS properties needed to keep borders visible
 * without re-saving the block.
 *
 * Mirrors the PHP fallback in `lib/block-supports/border.php` so editor and
 * front-end output stay consistent. Keep the two implementations in sync.
 *
 * @param {Object} attributes               Subset of block attributes.
 * @param {string} [attributes.borderColor] Block `borderColor` preset attribute.
 * @param {Object} [attributes.style]       Block `style` attribute.
 * @param {Object} inherited                Inheritance flags from
 *                                          {@link getInheritedBorderStyles}.
 *
 * @return {Object} Inline style object containing `borderTopStyle`,
 *                  `borderRightStyle`, etc. for sides that need a fallback.
 */
export function getBorderStyleFallbacks(
	{ borderColor, style } = {},
	inherited
) {
	const border = style?.border;
	const fallback = {};

	const hasShorthandValue =
		!! borderColor || !! border?.color || !! border?.width;
	const hasShorthandStyle = !! border?.style;

	BORDER_SIDES.forEach( ( side ) => {
		if ( inherited?.[ side ] ) {
			return;
		}

		// If the cascade already provides a visible style for this side —
		// either an explicit per-side style or a shorthand style which
		// applies to every side via CSS — no fallback is needed.
		const sideBorder = border?.[ side ];
		if ( !! sideBorder?.style || hasShorthandStyle ) {
			return;
		}

		const sideHasValue = !! sideBorder?.color || !! sideBorder?.width;

		// A fallback is needed if the side has its own color/width without
		// a style, or if the shorthand provides color/width but no style
		// (which would otherwise leave this side invisible).
		if ( ! sideHasValue && ! hasShorthandValue ) {
			return;
		}

		fallback[ BORDER_SIDE_TO_STYLE_KEY[ side ] ] = 'solid';
	} );

	return fallback;
}

const getColorByProperty = ( colors, property, value ) => {
	let matchedColor;

	colors.some( ( origin ) =>
		origin.colors.some( ( color ) => {
			if ( color[ property ] === value ) {
				matchedColor = color;
				return true;
			}

			return false;
		} )
	);

	return matchedColor;
};

export const getMultiOriginColor = ( { colors, namedColor, customColor } ) => {
	// Search each origin (default, theme, or user) for matching color by name.
	if ( namedColor ) {
		const colorObject = getColorByProperty( colors, 'slug', namedColor );
		if ( colorObject ) {
			return colorObject;
		}
	}

	// Skip if no custom color or matching named color.
	if ( ! customColor ) {
		return { color: undefined };
	}

	// Attempt to find color via custom color value or build new object.
	const colorObject = getColorByProperty( colors, 'color', customColor );
	return colorObject ? colorObject : { color: customColor };
};

function getColorSlugFromVariable( value ) {
	const namedColor = /var:preset\|color\|(.+)/.exec( value );
	if ( namedColor && namedColor[ 1 ] ) {
		return namedColor[ 1 ];
	}
	return null;
}

function styleToAttributes( style ) {
	if ( hasSplitBorders( style?.border ) ) {
		return {
			style,
			borderColor: undefined,
		};
	}

	const borderColorValue = style?.border?.color;
	const borderColorSlug = borderColorValue?.startsWith( 'var:preset|color|' )
		? borderColorValue.substring( 'var:preset|color|'.length )
		: undefined;
	const updatedStyle = { ...style };
	updatedStyle.border = {
		...updatedStyle.border,
		color: borderColorSlug ? undefined : borderColorValue,
	};
	return {
		style: cleanEmptyObject( updatedStyle ),
		borderColor: borderColorSlug,
	};
}

function attributesToStyle( attributes ) {
	if ( hasSplitBorders( attributes.style?.border ) ) {
		return attributes.style;
	}
	return {
		...attributes.style,
		border: {
			...attributes.style?.border,
			color: attributes.borderColor
				? 'var:preset|color|' + attributes.borderColor
				: attributes.style?.border?.color,
		},
	};
}

function BordersInspectorControl( { label, children, resetAllFilter } ) {
	const attributesResetAllFilter = useCallback(
		( attributes ) => {
			const existingStyle = attributesToStyle( attributes );
			const updatedStyle = resetAllFilter( existingStyle );
			return {
				...attributes,
				...styleToAttributes( updatedStyle ),
			};
		},
		[ resetAllFilter ]
	);

	return (
		<InspectorControls
			group="border"
			resetAllFilter={ attributesResetAllFilter }
			label={ label }
		>
			{ children }
		</InspectorControls>
	);
}

export function BorderPanel( { clientId, name, setAttributes, settings } ) {
	const isEnabled = useHasBorderPanel( settings );
	const { style, borderColor, blockBorder, variationBorder } = useSelect(
		( select ) => {
			// Early return to avoid subscription work when disabled.
			if ( ! isEnabled ) {
				return {};
			}
			const { getBlockAttributes, getSettings } =
				select( blockEditorStore );
			const attributes = getBlockAttributes( clientId ) || {};
			const blockNode =
				getSettings()?.[ globalStylesDataKey ]?.styles?.blocks?.[
					name
				];
			const registeredStyles =
				select( blocksStore ).getBlockStyles( name );
			const variationName = getVariationNameFromClass(
				attributes.className,
				registeredStyles
			);
			return {
				style: attributes.style,
				borderColor: attributes.borderColor,
				blockBorder: blockNode?.border,
				variationBorder: variationName
					? blockNode?.variations?.[ variationName ]?.border
					: undefined,
			};
		},
		[ clientId, name, isEnabled ]
	);
	const inheritedBorderStyles = useMemo(
		() => getInheritedBorderStyles( blockBorder, variationBorder ),
		[ blockBorder, variationBorder ]
	);
	const value = useMemo( () => {
		return attributesToStyle( { style, borderColor } );
	}, [ style, borderColor ] );

	const onChange = ( newStyle ) => {
		const updatedBorder = applyBorderStyleDefaults(
			newStyle?.border,
			inheritedBorderStyles
		);
		setAttributes(
			styleToAttributes( { ...newStyle, border: updatedBorder } )
		);
	};

	if ( ! isEnabled ) {
		return null;
	}

	const defaultControls = {
		...getBlockSupport( name, [
			BORDER_SUPPORT_KEY,
			'__experimentalDefaultControls',
		] ),
		...getBlockSupport( name, [
			SHADOW_SUPPORT_KEY,
			'__experimentalDefaultControls',
		] ),
	};

	return (
		<StylesBorderPanel
			as={ BordersInspectorControl }
			panelId={ clientId }
			settings={ settings }
			value={ value }
			onChange={ onChange }
			defaultControls={ defaultControls }
		/>
	);
}

/**
 * Determine whether there is block support for border properties.
 *
 * @param {string} blockName Block name.
 * @param {string} feature   Border feature to check support for.
 *
 * @return {boolean} Whether there is support.
 */
export function hasBorderSupport( blockName, feature = 'any' ) {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const support = getBlockSupport( blockName, BORDER_SUPPORT_KEY );

	if ( support === true ) {
		return true;
	}

	if ( feature === 'any' ) {
		return !! (
			support?.color ||
			support?.radius ||
			support?.width ||
			support?.style
		);
	}

	return !! support?.[ feature ];
}

/**
 * Determine whether there is block support for shadow properties.
 *
 * @param {string} blockName Block name.
 *
 * @return {boolean} Whether there is support.
 */
export function hasShadowSupport( blockName ) {
	return hasBlockSupport( blockName, SHADOW_SUPPORT_KEY );
}

export function useBorderPanelLabel( {
	blockName,
	hasBorderControl,
	hasShadowControl,
} = {} ) {
	const settings = useBlockSettings( blockName );
	const controls = useHasBorderPanelControls( settings );

	if ( ! hasBorderControl && ! hasShadowControl && blockName ) {
		hasBorderControl =
			controls?.hasBorderColor ||
			controls?.hasBorderStyle ||
			controls?.hasBorderWidth ||
			controls?.hasBorderRadius;
		hasShadowControl = controls?.hasShadow;
	}

	if ( hasBorderControl && hasShadowControl ) {
		return __( 'Border & Shadow' );
	}

	if ( hasShadowControl ) {
		return __( 'Shadow' );
	}

	return __( 'Border' );
}

/**
 * Returns a new style object where the specified border attribute has been
 * removed.
 *
 * @param {Object} style     Styles from block attributes.
 * @param {string} attribute The border style attribute to clear.
 *
 * @return {Object} Style object with the specified attribute removed.
 */
export function removeBorderAttribute( style, attribute ) {
	return cleanEmptyObject( {
		...style,
		border: {
			...style?.border,
			[ attribute ]: undefined,
		},
	} );
}

/**
 * Filters registered block settings, extending attributes to include
 * `borderColor` if needed.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Updated block settings.
 */
function addAttributes( settings ) {
	if ( ! hasBorderSupport( settings, 'color' ) ) {
		return settings;
	}

	// Allow blocks to specify default value if needed.
	if ( settings.attributes.borderColor ) {
		return settings;
	}

	// Add new borderColor attribute to block settings.
	return {
		...settings,
		attributes: {
			...settings.attributes,
			borderColor: {
				type: 'string',
			},
		},
	};
}

/**
 * Override props assigned to save component to inject border color.
 *
 * @param {Object}        props           Additional props applied to save element.
 * @param {Object|string} blockNameOrType Block type definition.
 * @param {Object}        attributes      Block's attributes.
 *
 * @return {Object} Filtered props to apply to save element.
 */
function addSaveProps( props, blockNameOrType, attributes ) {
	if (
		! hasBorderSupport( blockNameOrType, 'color' ) ||
		shouldSkipSerialization( blockNameOrType, BORDER_SUPPORT_KEY, 'color' )
	) {
		return props;
	}

	const borderClasses = getBorderClasses( attributes );
	const newClassName = clsx( props.className, borderClasses );

	// If we are clearing the last of the previous classes in `className`
	// set it to `undefined` to avoid rendering empty DOM attributes.
	props.className = newClassName ? newClassName : undefined;

	return props;
}

/**
 * Generates a CSS class name consisting of all the applicable border color
 * classes given the current block attributes.
 *
 * @param {Object} attributes Block's attributes.
 *
 * @return {string} CSS class name.
 */
export function getBorderClasses( attributes ) {
	const { borderColor, style } = attributes;
	const borderColorClass = getColorClassName( 'border-color', borderColor );

	return clsx( {
		'has-border-color': borderColor || style?.border?.color,
		[ borderColorClass ]: !! borderColorClass,
	} );
}

function useBlockProps( { name, clientId, borderColor, style } ) {
	const { colors } = useMultipleOriginColorsAndGradients();
	// Narrow the selector to only the slices needed to resolve inherited
	// border styles. Subscribing to the entire global-styles tree or to
	// `getBlockAttributes( clientId )` here would cause every border-support
	// block to re-render on any unrelated global-styles or attribute change.
	const { blockBorder, variationBorder } = useSelect(
		( select ) => {
			const { getBlockAttributes, getSettings } =
				select( blockEditorStore );
			const attrs = getBlockAttributes( clientId );
			const blockNode =
				getSettings()?.[ globalStylesDataKey ]?.styles?.blocks?.[
					name
				];
			const registeredStyles =
				select( blocksStore ).getBlockStyles( name );
			const variationName = getVariationNameFromClass(
				attrs?.className,
				registeredStyles
			);
			return {
				blockBorder: blockNode?.border,
				variationBorder: variationName
					? blockNode?.variations?.[ variationName ]?.border
					: undefined,
			};
		},
		[ clientId, name ]
	);

	if (
		! hasBorderSupport( name, 'color' ) ||
		shouldSkipSerialization( name, BORDER_SUPPORT_KEY, 'color' )
	) {
		return {};
	}

	// Quick exit when the block has no border-related attribute at all.
	// Avoids the preset-color resolution and fallback work below for the
	// common case of border-supporting blocks without border data set.
	if ( ! borderColor && ! style?.border ) {
		return {};
	}

	const { color: borderColorValue } = getMultiOriginColor( {
		colors,
		namedColor: borderColor,
	} );
	const { color: borderTopColor } = getMultiOriginColor( {
		colors,
		namedColor: getColorSlugFromVariable( style?.border?.top?.color ),
	} );
	const { color: borderRightColor } = getMultiOriginColor( {
		colors,
		namedColor: getColorSlugFromVariable( style?.border?.right?.color ),
	} );

	const { color: borderBottomColor } = getMultiOriginColor( {
		colors,
		namedColor: getColorSlugFromVariable( style?.border?.bottom?.color ),
	} );
	const { color: borderLeftColor } = getMultiOriginColor( {
		colors,
		namedColor: getColorSlugFromVariable( style?.border?.left?.color ),
	} );

	const inherited = getInheritedBorderStyles( blockBorder, variationBorder );
	// Note: `extraStyles.borderXStyle` values flow into the editor wrapper
	// via `addSaveProps` but `addSaveProps` only forwards `className` to saved
	// HTML. Render-time fallback for the front end is applied in PHP by
	// `gutenberg_apply_border_support`, which runs via
	// `WP_Block_Supports::apply_block_supports()` for both static and dynamic
	// blocks. The two paths share the same algorithm; keep them in sync.
	const styleFallbacks = getBorderStyleFallbacks(
		{ borderColor, style },
		inherited
	);

	const extraStyles = {
		borderTopColor: borderTopColor || borderColorValue,
		borderRightColor: borderRightColor || borderColorValue,
		borderBottomColor: borderBottomColor || borderColorValue,
		borderLeftColor: borderLeftColor || borderColorValue,
		...styleFallbacks,
	};

	return addSaveProps(
		{ style: cleanEmptyObject( extraStyles ) || {} },
		name,
		{ borderColor, style }
	);
}

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'borderColor', 'style' ],
	hasSupport( name ) {
		return hasBorderSupport( name, 'color' );
	},
};

addFilter(
	'blocks.registerBlockType',
	'core/border/addAttributes',
	addAttributes
);
