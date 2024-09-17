/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { hasBlockSupport, getBlockSupport } from '@wordpress/blocks';
import { __experimentalHasSplitBorders as hasSplitBorders } from '@wordpress/components';
import { Platform, useCallback, useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';

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
import { __ } from '@wordpress/i18n';

export const BORDER_SUPPORT_KEY = '__experimentalBorder';
export const SHADOW_SUPPORT_KEY = 'shadow';

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
	function selector( select ) {
		const { style, borderColor } =
			select( blockEditorStore ).getBlockAttributes( clientId ) || {};
		return { style, borderColor };
	}
	const { style, borderColor } = useSelect( selector, [ clientId ] );
	const value = useMemo( () => {
		return attributesToStyle( { style, borderColor } );
	}, [ style, borderColor ] );

	const onChange = ( newStyle ) => {
		setAttributes( styleToAttributes( newStyle ) );
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

function useBlockProps( { name, borderColor, style } ) {
	const { colors } = useMultipleOriginColorsAndGradients();

	if (
		! hasBorderSupport( name, 'color' ) ||
		shouldSkipSerialization( name, BORDER_SUPPORT_KEY, 'color' )
	) {
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

	const extraStyles = {
		borderTopColor: borderTopColor || borderColorValue,
		borderRightColor: borderRightColor || borderColorValue,
		borderBottomColor: borderBottomColor || borderColorValue,
		borderLeftColor: borderLeftColor || borderColorValue,
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
