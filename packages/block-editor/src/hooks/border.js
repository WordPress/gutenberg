/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import {
	__experimentalBorderBoxControl as BorderBoxControl,
	__experimentalHasSplitBorders as hasSplitBorders,
	__experimentalIsDefinedBorder as isDefinedBorder,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Platform } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	BorderRadiusEdit,
	hasBorderRadiusValue,
	resetBorderRadius,
} from './border-radius';
import { getColorClassName } from '../components/colors';
import InspectorControls from '../components/inspector-controls';
import useMultipleOriginColorsAndGradients from '../components/colors-gradients/use-multiple-origin-colors-and-gradients';
import useSetting from '../components/use-setting';
import { cleanEmptyObject, shouldSkipSerialization } from './utils';

export const BORDER_SUPPORT_KEY = '__experimentalBorder';

const borderSides = [ 'top', 'right', 'bottom', 'left' ];

const hasBorderValue = ( props ) => {
	const { borderColor, style } = props.attributes;
	return isDefinedBorder( style?.border ) || !! borderColor;
};

// The border color, style, and width are omitted so they get undefined. The
// border radius is separate and must retain its selection.
const resetBorder = ( { attributes = {}, setAttributes } ) => {
	const { style } = attributes;
	setAttributes( {
		borderColor: undefined,
		style: {
			...style,
			border: cleanEmptyObject( {
				radius: style?.border?.radius,
			} ),
		},
	} );
};

const resetBorderFilter = ( newAttributes ) => ( {
	...newAttributes,
	borderColor: undefined,
	style: {
		...newAttributes.style,
		border: {
			radius: newAttributes.style?.border?.radius,
		},
	},
} );

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

const getBorderObject = ( attributes, colors ) => {
	const { borderColor, style } = attributes;
	const { border: borderStyles } = style || {};

	// If we have a named color for a flat border. Fetch that color object and
	// apply that color's value to the color property within the style object.
	if ( borderColor ) {
		const { color } = getMultiOriginColor( {
			colors,
			namedColor: borderColor,
		} );

		return color ? { ...borderStyles, color } : borderStyles;
	}

	// Individual side border color slugs are stored within the border style
	// object. If we don't have a border styles object we have nothing further
	// to hydrate.
	if ( ! borderStyles ) {
		return borderStyles;
	}

	// If we have named colors for the individual side borders, retrieve their
	// related color objects and apply the real color values to the split
	// border objects.
	const hydratedBorderStyles = { ...borderStyles };
	borderSides.forEach( ( side ) => {
		const colorSlug = getColorSlugFromVariable(
			hydratedBorderStyles[ side ]?.color
		);
		if ( colorSlug ) {
			const { color } = getMultiOriginColor( {
				colors,
				namedColor: colorSlug,
			} );
			hydratedBorderStyles[ side ] = {
				...hydratedBorderStyles[ side ],
				color,
			};
		}
	} );

	return hydratedBorderStyles;
};

function getColorSlugFromVariable( value ) {
	const namedColor = /var:preset\|color\|(.+)/.exec( value );
	if ( namedColor && namedColor[ 1 ] ) {
		return namedColor[ 1 ];
	}
	return null;
}

export function BorderPanel( props ) {
	const { attributes, clientId, setAttributes } = props;
	const { style } = attributes;
	const { colors } = useMultipleOriginColorsAndGradients();

	const isSupported = hasBorderSupport( props.name );
	const isColorSupported =
		useSetting( 'border.color' ) && hasBorderSupport( props.name, 'color' );
	const isRadiusSupported =
		useSetting( 'border.radius' ) &&
		hasBorderSupport( props.name, 'radius' );
	const isStyleSupported =
		useSetting( 'border.style' ) && hasBorderSupport( props.name, 'style' );
	const isWidthSupported =
		useSetting( 'border.width' ) && hasBorderSupport( props.name, 'width' );

	const isDisabled = [
		! isColorSupported,
		! isRadiusSupported,
		! isStyleSupported,
		! isWidthSupported,
	].every( Boolean );

	if ( isDisabled || ! isSupported ) {
		return null;
	}

	const defaultBorderControls = getBlockSupport( props.name, [
		BORDER_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	const showBorderByDefault =
		defaultBorderControls?.color || defaultBorderControls?.width;

	const onBorderChange = ( newBorder ) => {
		// Filter out named colors and apply them to appropriate block
		// attributes so that CSS classes can be used to apply those colors.
		// e.g. has-primary-border-top-color.

		let newBorderStyles = { ...newBorder };
		let newBorderColor;

		if ( hasSplitBorders( newBorder ) ) {
			// For each side check if the side has a color value set
			// If so, determine if it belongs to a named color, in which case
			// we update the color property.
			//
			// This deliberately overwrites `newBorderStyles` to avoid mutating
			// the passed object which causes problems otherwise.
			newBorderStyles = {
				top: { ...newBorder.top },
				right: { ...newBorder.right },
				bottom: { ...newBorder.bottom },
				left: { ...newBorder.left },
			};

			borderSides.forEach( ( side ) => {
				if ( newBorder[ side ]?.color ) {
					const colorObject = getMultiOriginColor( {
						colors,
						customColor: newBorder[ side ]?.color,
					} );

					if ( colorObject.slug ) {
						newBorderStyles[
							side
						].color = `var:preset|color|${ colorObject.slug }`;
					}
				}
			} );
		} else if ( newBorder?.color ) {
			// We have a flat border configuration. Apply named color slug to
			// `borderColor` attribute and clear color style property if found.
			const customColor = newBorder?.color;
			const colorObject = getMultiOriginColor( { colors, customColor } );

			if ( colorObject.slug ) {
				newBorderColor = colorObject.slug;
				newBorderStyles.color = undefined;
			}
		}

		// Ensure previous border radius styles are maintained and clean
		// overall result for empty objects or properties.
		const newStyle = cleanEmptyObject( {
			...style,
			border: { radius: style?.border?.radius, ...newBorderStyles },
		} );

		setAttributes( {
			style: newStyle,
			borderColor: newBorderColor,
		} );
	};

	const hydratedBorder = getBorderObject( attributes, colors );

	return (
		<InspectorControls __experimentalGroup="border">
			{ ( isWidthSupported || isColorSupported ) && (
				<ToolsPanelItem
					hasValue={ () => hasBorderValue( props ) }
					label={ __( 'Border' ) }
					onDeselect={ () => resetBorder( props ) }
					isShownByDefault={ showBorderByDefault }
					resetAllFilter={ resetBorderFilter }
					panelId={ clientId }
				>
					<BorderBoxControl
						colors={ colors }
						enableAlpha={ true }
						enableStyle={ isStyleSupported }
						onChange={ onBorderChange }
						popoverOffset={ 40 }
						popoverPlacement="left-start"
						size="__unstable-large"
						value={ hydratedBorder }
						__experimentalIsRenderedInSidebar={ true }
					/>
				</ToolsPanelItem>
			) }
			{ isRadiusSupported && (
				<ToolsPanelItem
					hasValue={ () => hasBorderRadiusValue( props ) }
					label={ __( 'Radius' ) }
					onDeselect={ () => resetBorderRadius( props ) }
					isShownByDefault={ defaultBorderControls?.radius }
					resetAllFilter={ ( newAttributes ) => ( {
						...newAttributes,
						style: {
							...newAttributes.style,
							border: {
								...newAttributes.style?.border,
								radius: undefined,
							},
						},
					} ) }
					panelId={ clientId }
				>
					<BorderRadiusEdit { ...props } />
				</ToolsPanelItem>
			) }
		</InspectorControls>
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
