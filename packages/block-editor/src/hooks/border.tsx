import clsx from 'clsx';
import { hasBlockSupport, getBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { __experimentalHasSplitBorders as hasSplitBorders } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { getColorClassName } from '../components/colors';
import InspectorControls from '../components/inspector-controls';
import useMultipleOriginColorsAndGradients from '../components/colors-gradients/use-multiple-origin-colors-and-gradients';
import { cleanEmptyObject, shouldSkipSerialization } from './utils';
import {
	useHasBorderPanel,
	BorderPanel as StylesBorderPanel,
} from '../components/global-styles';
import { useResolvedStyle } from '../components/global-styles/inherited-value-context';
import { store as blockEditorStore } from '../store';
import {
	getStyleForState,
	isDefaultBlockStyleState,
	setStyleForState,
	useBlockStyleState,
} from './block-style-state';
import type { ColorOrigin } from '../components/colors-gradients/types';
import type { PanelStyle } from '../components/global-styles/types';
import type {
	BorderAttributes,
	BorderHookPanelProps,
	BlockWrapperProps,
	MultiOriginColor,
	ResetAllFilter,
	StyleInspectorControlProps,
} from './types';

type BorderBoxValue = Parameters< typeof hasSplitBorders >[ 0 ];

export const BORDER_SUPPORT_KEY = '__experimentalBorder';
export const SHADOW_SUPPORT_KEY = 'shadow';

const getColorByProperty = (
	colors: ColorOrigin[],
	property: 'slug' | 'color',
	value: string
) => {
	let matchedColor: ColorOrigin[ 'colors' ][ number ] | undefined;

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

export const getMultiOriginColor = ( {
	colors,
	namedColor,
	customColor,
}: {
	colors: ColorOrigin[];
	namedColor?: string | null;
	customColor?: string;
} ): MultiOriginColor => {
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

function getColorSlugFromVariable( value: unknown ) {
	// `exec` coerces a non-string value to a string.
	const namedColor = /var:preset\|color\|(.+)/.exec( value as string );
	if ( namedColor && namedColor[ 1 ] ) {
		return namedColor[ 1 ];
	}
	return null;
}

function styleToAttributes( style: PanelStyle ): BorderAttributes {
	// The border styles have the shape of the border box value.
	if ( hasSplitBorders( style?.border as BorderBoxValue ) ) {
		return {
			style,
			borderColor: undefined,
		};
	}

	// A border color is stored as a string.
	const borderColorValue = style?.border?.color as string | undefined;
	const borderColorSlug = borderColorValue?.startsWith( 'var:preset|color|' )
		? borderColorValue.substring( 'var:preset|color|'.length )
		: undefined;
	const updatedStyle: PanelStyle = { ...style };
	updatedStyle.border = {
		...updatedStyle.border,
		color: borderColorSlug ? undefined : borderColorValue,
	};
	return {
		// Cleaning leaves out only the empty values.
		style: cleanEmptyObject( updatedStyle ) as PanelStyle | undefined,
		borderColor: borderColorSlug,
	};
}

function attributesToStyle(
	attributes: BorderAttributes
): PanelStyle | undefined {
	// The border styles have the shape of the border box value.
	if ( hasSplitBorders( attributes.style?.border as BorderBoxValue ) ) {
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

function BordersInspectorControl( {
	label,
	children,
	resetAllFilter,
}: StyleInspectorControlProps & { label?: string } ) {
	const attributesResetAllFilter = useCallback(
		( attributes: BorderAttributes ) => {
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
			// The filter reads the border attributes.
			resetAllFilter={ attributesResetAllFilter as ResetAllFilter }
			// @ts-expect-error InspectorControls ignores the label.
			label={ label }
		>
			{ children }
		</InspectorControls>
	);
}

export function BorderPanel( {
	clientId,
	name,
	setAttributes,
	settings,
}: BorderHookPanelProps ) {
	const selectedState = useBlockStyleState();
	const isEnabled = useHasBorderPanel( settings );
	const { style, borderColor, className }: BorderAttributes = useSelect(
		( select ) => {
			// Early return to avoid subscription when disabled
			if ( ! isEnabled ) {
				return {};
			}
			const {
				style: _style,
				borderColor: _borderColor,
				className: _className,
			} = ( select( blockEditorStore ).getBlockAttributes( clientId ) ||
				// The block's attributes hold its border styles.
				{} ) as BorderAttributes;
			return {
				style: _style,
				borderColor: _borderColor,
				className: _className,
			};
		},
		[ clientId, isEnabled ]
	);

	const { value: inheritedValue } = useResolvedStyle(
		name,
		className,
		selectedState
	);

	const isStateSelected = ! isDefaultBlockStyleState( selectedState );

	const value = useMemo( () => {
		if ( isStateSelected ) {
			// The state styles have the shape of the block styles.
			return getStyleForState( style, selectedState ) as
				PanelStyle | undefined;
		}
		return attributesToStyle( { style, borderColor } );
	}, [ isStateSelected, selectedState, style, borderColor ] );

	const onChange = isStateSelected
		? ( newStyle: PanelStyle ) => {
				setAttributes( {
					style: setStyleForState( style, selectedState, newStyle ),
				} );
			}
		: ( newStyle: PanelStyle ) => {
				setAttributes( styleToAttributes( newStyle ) );
			};

	if ( ! isEnabled ) {
		return null;
	}

	// The default controls map control names to whether they show.
	const defaultControls = {
		...( getBlockSupport( name, [
			BORDER_SUPPORT_KEY,
			'__experimentalDefaultControls',
		] ) as Record< string, boolean > | undefined ),
		...( getBlockSupport( name, [
			SHADOW_SUPPORT_KEY,
			'__experimentalDefaultControls',
		] ) as Record< string, boolean > | undefined ),
	};

	return (
		<StylesBorderPanel
			as={ BordersInspectorControl }
			panelId={ clientId }
			settings={ settings }
			value={ value }
			onChange={ onChange }
			defaultControls={ defaultControls }
			inheritedValue={ inheritedValue }
		/>
	);
}

/**
 * Determine whether there is block support for border properties.
 *
 * @param blockName Block name.
 * @param feature   Border feature to check support for.
 *
 * @return Whether there is support.
 */
export function hasBorderSupport(
	blockName: string | BlockType,
	feature: string = 'any'
): boolean {
	// The support is `true` or flags each border feature.
	const support = getBlockSupport( blockName, BORDER_SUPPORT_KEY ) as
		true | Record< string, unknown > | undefined;

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
 * @param blockName Block name.
 *
 * @return Whether there is support.
 */
export function hasShadowSupport( blockName: string | BlockType ) {
	return hasBlockSupport( blockName, SHADOW_SUPPORT_KEY );
}

/**
 * Returns a new style object where the specified border attribute has been
 * removed.
 *
 * @param style     Styles from block attributes.
 * @param attribute The border style attribute to clear.
 *
 * @return Style object with the specified attribute removed.
 */
export function removeBorderAttribute(
	style: PanelStyle | undefined,
	attribute: string
) {
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
 * @param settings Original block settings.
 *
 * @return Updated block settings.
 */
function addAttributes( settings: BlockType ): BlockType {
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
 * @param props           Additional props applied to save element.
 * @param blockNameOrType Block type definition.
 * @param attributes      Block's attributes.
 *
 * @return Filtered props to apply to save element.
 */
function addSaveProps(
	props: BlockWrapperProps,
	blockNameOrType: BlockType | string,
	attributes: BorderAttributes
): BlockWrapperProps {
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
 * @param attributes Block's attributes.
 *
 * @return CSS class name.
 */
export function getBorderClasses( attributes: BorderAttributes ) {
	const { borderColor, style } = attributes;
	const borderColorClass = getColorClassName( 'border-color', borderColor );

	return clsx( {
		'has-border-color': borderColor || style?.border?.color,
		// An unset class is skipped, as `!! undefined` is false.
		[ borderColorClass as string ]: !! borderColorClass,
	} );
}

function useBlockProps( {
	name,
	borderColor,
	style,
}: {
	name: string;
	borderColor?: string;
	style?: PanelStyle;
} ) {
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
	hasSupport( name: string | BlockType ) {
		return hasBorderSupport( name, 'color' );
	},
};

addFilter(
	'blocks.registerBlockType',
	'core/border/addAttributes',
	addAttributes
);
