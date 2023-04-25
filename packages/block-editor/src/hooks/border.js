/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { __experimentalHasSplitBorders as hasSplitBorders } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Platform, useCallback, useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

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
	BorderPanel as StylesBorderPanel,
} from '../components/global-styles';

export const BORDER_SUPPORT_KEY = '__experimentalBorder';

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

function BordersInspectorControl( { children, resetAllFilter } ) {
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
		>
			{ children }
		</InspectorControls>
	);
}

export function BorderPanel( props ) {
	const { clientId, name, attributes, setAttributes } = props;
	const settings = useBlockSettings( name );
	const isEnabled = useHasBorderPanel( settings );
	const value = useMemo( () => {
		return attributesToStyle( {
			style: attributes.style,
			borderColor: attributes.borderColor,
		} );
	}, [ attributes.style, attributes.borderColor ] );

	const onChange = ( newStyle ) => {
		setAttributes( styleToAttributes( newStyle ) );
	};

	if ( ! isEnabled ) {
		return null;
	}

	const defaultControls = getBlockSupport( props.name, [
		BORDER_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

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
 * @param {Object} props      Additional props applied to save element.
 * @param {Object} blockType  Block type definition.
 * @param {Object} attributes Block's attributes.
 *
 * @return {Object} Filtered props to apply to save element.
 */
function addSaveProps( props, blockType, attributes ) {
	if (
		! hasBorderSupport( blockType, 'color' ) ||
		shouldSkipSerialization( blockType, BORDER_SUPPORT_KEY, 'color' )
	) {
		return props;
	}

	const borderClasses = getBorderClasses( attributes );
	const newClassName = classnames( props.className, borderClasses );

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

	return classnames( {
		'has-border-color': borderColor || style?.border?.color,
		[ borderColorClass ]: !! borderColorClass,
	} );
}

/**
 * Filters the registered block settings to apply border color styles and
 * classnames to the block edit wrapper.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addEditProps( settings ) {
	if (
		! hasBorderSupport( settings, 'color' ) ||
		shouldSkipSerialization( settings, BORDER_SUPPORT_KEY, 'color' )
	) {
		return settings;
	}

	const existingGetEditWrapperProps = settings.getEditWrapperProps;
	settings.getEditWrapperProps = ( attributes ) => {
		let props = {};

		if ( existingGetEditWrapperProps ) {
			props = existingGetEditWrapperProps( attributes );
		}

		return addSaveProps( props, settings, attributes );
	};

	return settings;
}

/**
 * This adds inline styles for color palette colors.
 * Ideally, this is not needed and themes should load their palettes on the editor.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
export const withBorderColorPaletteStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { name, attributes } = props;
		const { borderColor, style } = attributes;
		const { colors } = useMultipleOriginColorsAndGradients();

		if (
			! hasBorderSupport( name, 'color' ) ||
			shouldSkipSerialization( name, BORDER_SUPPORT_KEY, 'color' )
		) {
			return <BlockListBlock { ...props } />;
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
			namedColor: getColorSlugFromVariable(
				style?.border?.bottom?.color
			),
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

		let wrapperProps = props.wrapperProps;
		wrapperProps = {
			...props.wrapperProps,
			style: {
				...props.wrapperProps?.style,
				...extraStyles,
			},
		};

		return <BlockListBlock { ...props } wrapperProps={ wrapperProps } />;
	}
);

addFilter(
	'blocks.registerBlockType',
	'core/border/addAttributes',
	addAttributes
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/border/addSaveProps',
	addSaveProps
);

addFilter(
	'blocks.registerBlockType',
	'core/border/addEditProps',
	addEditProps
);

addFilter(
	'editor.BlockListBlock',
	'core/border/with-border-color-palette-styles',
	withBorderColorPaletteStyles
);
