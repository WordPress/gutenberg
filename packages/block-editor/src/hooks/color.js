/**
 * External dependencies
 */
import classnames from 'classnames';
import { isObject, setWith, clone } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { getBlockSupport } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useRef, useEffect, Platform } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	getColorClassName,
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
} from '../components/colors';
import {
	__experimentalGetGradientClass,
	getGradientValueBySlug,
	getGradientSlugByValue,
} from '../components/gradients';
import { cleanEmptyObject } from './utils';
import ColorPanel from './color-panel';
import useSetting from '../components/use-setting';

export const COLOR_SUPPORT_KEY = 'color';
const EMPTY_ARRAY = [];

const hasColorSupport = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );
	return (
		colorSupport &&
		( colorSupport.link === true ||
			colorSupport.gradient === true ||
			colorSupport.background !== false ||
			colorSupport.text !== false )
	);
};

const shouldSkipSerialization = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return colorSupport?.__experimentalSkipSerialization;
};

const hasLinkColorSupport = ( blockType ) => {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return isObject( colorSupport ) && !! colorSupport.link;
};

const hasGradientSupport = ( blockType ) => {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return isObject( colorSupport ) && !! colorSupport.gradients;
};

const hasBackgroundColorSupport = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return colorSupport && colorSupport.background !== false;
};

const hasTextColorSupport = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return colorSupport && colorSupport.text !== false;
};

const hasColorSetsSupport = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return (
		colorSupport &&
		Array.isArray( colorSupport.sets ) &&
		colorSupport.sets.length
	);
};

const getColorSets = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );
	return colorSupport?.sets || [];
};

const resetDefaultColors = ( { attributes, setAttributes } ) => {
	const { style } = attributes;
	const newStyle = immutableSet(
		{
			...style,
			color: {
				...style?.color,
				background: undefined,
				gradient: undefined,
				text: undefined,
			},
		},
		[ 'elements', 'link', 'color', 'text' ],
		undefined
	);

	setAttributes( {
		backgroundColor: undefined,
		gradient: undefined,
		textColor: undefined,
		style: newStyle,
	} );
};

/**
 * Filters registered block settings, extending attributes to include
 * `backgroundColor` and `textColor` attribute.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttributes( settings ) {
	if ( ! hasColorSupport( settings ) ) {
		return settings;
	}

	// allow blocks to specify their own attribute definition with default values if needed.
	if ( ! settings.attributes.backgroundColor ) {
		Object.assign( settings.attributes, {
			backgroundColor: {
				type: 'string',
			},
		} );
	}
	if ( ! settings.attributes.textColor ) {
		Object.assign( settings.attributes, {
			textColor: {
				type: 'string',
			},
		} );
	}

	if ( hasGradientSupport( settings ) && ! settings.attributes.gradient ) {
		Object.assign( settings.attributes, {
			gradient: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override props assigned to save component to inject colors classnames.
 *
 * @param {Object} props      Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( props, blockType, attributes ) {
	if (
		! hasColorSupport( blockType ) ||
		shouldSkipSerialization( blockType )
	) {
		return props;
	}

	const hasGradient = hasGradientSupport( blockType );

	// I'd have preferred to avoid the "style" attribute usage here
	const { backgroundColor, textColor, gradient, style } = attributes;

	const backgroundClass = getColorClassName(
		'background-color',
		backgroundColor
	);
	const gradientClass = __experimentalGetGradientClass( gradient );
	const textClass = getColorClassName( 'color', textColor );
	const newClassName = classnames(
		props.className,
		textClass,
		gradientClass,
		{
			// Don't apply the background class if there's a custom gradient
			[ backgroundClass ]:
				( ! hasGradient || ! style?.color?.gradient ) &&
				!! backgroundClass,
			'has-text-color': textColor || style?.color?.text,
			'has-background':
				backgroundColor ||
				style?.color?.background ||
				( hasGradient && ( gradient || style?.color?.gradient ) ),
			'has-link-color': style?.elements?.link?.color,
		}
	);
	props.className = newClassName ? newClassName : undefined;

	return props;
}

/**
 * Filters registered block settings to extend the block edit wrapper
 * to apply the desired styles and classnames properly.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addEditProps( settings ) {
	if (
		! hasColorSupport( settings ) ||
		shouldSkipSerialization( settings )
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

const getLinkColorFromAttributeValue = ( colors, value ) => {
	const attributeParsed = /var:preset\|color\|(.+)/.exec( value );
	if ( attributeParsed && attributeParsed[ 1 ] ) {
		return getColorObjectByAttributeValues( colors, attributeParsed[ 1 ] )
			.color;
	}
	return value;
};

function immutableSet( object, path, value ) {
	return setWith( object ? clone( object ) : {}, path, value, clone );
}

/**
 * Checks whether a custom color set has one of its color values set.
 *
 * @param {string} colorSetName Name of a custom color set to check.
 * @return {boolean} Whether or not a custom color set has a value.
 */
const hasSetColor = ( colorSetName ) => ( props ) => {
	const colorSet = props.attributes.style?.color?.sets?.[ colorSetName ];

	return colorSet?.color || colorSet?.background;
};

/**
 * Resets a custom color set by setting its corresponding attribute to
 * undefined.
 *
 * @param {string} colorSet Name of color set to clear.
 */
const resetColorSet = ( colorSet ) => ( { attributes, setAttributes } ) => {
	const { style } = attributes;

	setAttributes( {
		style: {
			...style,
			color: {
				...style?.color,
				sets: {
					...style?.color?.sets,
					[ colorSet ]: undefined,
				},
			},
		},
	} );
};

/**
 * Inspector control panel containing the color related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Color edit element.
 */
export function ColorEdit( props ) {
	const { name: blockName, attributes, setAttributes } = props;
	const isLinkColorEnabled = useSetting( 'color.link' );
	const colors = useSetting( 'color.palette' ) || EMPTY_ARRAY;
	const gradients = useSetting( 'color.gradients' ) || EMPTY_ARRAY;

	// Shouldn't be needed but right now the ColorGradientsPanel
	// can trigger both onChangeColor and onChangeBackground
	// synchronously causing our two callbacks to override changes
	// from each other.
	const localAttributes = useRef( attributes );
	useEffect( () => {
		localAttributes.current = attributes;
	}, [ attributes ] );

	if ( ! hasColorSupport( blockName ) || Platform.OS !== 'web' ) {
		return null;
	}

	const hasBackground = hasBackgroundColorSupport( blockName );
	const hasGradient = hasGradientSupport( blockName );

	const { style, textColor, backgroundColor, gradient } = attributes;
	let gradientValue;
	if ( hasGradient && gradient ) {
		gradientValue = getGradientValueBySlug( gradients, gradient );
	} else if ( hasGradient ) {
		gradientValue = style?.color?.gradient;
	}

	const onChangeColor = ( name ) => ( value ) => {
		const colorObject = getColorObjectByColorValue( colors, value );
		const attributeName = name + 'Color';
		const newStyle = {
			...localAttributes.current.style,
			color: {
				...localAttributes.current?.style?.color,
				[ name ]: colorObject?.slug ? undefined : value,
			},
		};

		const newNamedColor = colorObject?.slug ? colorObject.slug : undefined;
		const newAttributes = {
			style: cleanEmptyObject( newStyle ),
			[ attributeName ]: newNamedColor,
		};

		props.setAttributes( newAttributes );
		localAttributes.current = {
			...localAttributes.current,
			...newAttributes,
		};
	};

	const onChangeGradient = ( value ) => {
		const slug = getGradientSlugByValue( gradients, value );
		let newAttributes;
		if ( slug ) {
			const newStyle = {
				...localAttributes.current?.style,
				color: {
					...localAttributes.current?.style?.color,
					gradient: undefined,
				},
			};
			newAttributes = {
				style: cleanEmptyObject( newStyle ),
				gradient: slug,
			};
		} else {
			const newStyle = {
				...localAttributes.current?.style,
				color: {
					...localAttributes.current?.style?.color,
					gradient: value,
				},
			};
			newAttributes = {
				style: cleanEmptyObject( newStyle ),
				gradient: undefined,
			};
		}
		props.setAttributes( newAttributes );
		localAttributes.current = {
			...localAttributes.current,
			...newAttributes,
		};
	};

	const onChangeLinkColor = ( value ) => {
		const colorObject = getColorObjectByColorValue( colors, value );
		const newLinkColorValue = colorObject?.slug
			? `var:preset|color|${ colorObject.slug }`
			: value;
		const newStyle = immutableSet(
			style,
			[ 'elements', 'link', 'color', 'text' ],
			newLinkColorValue
		);
		props.setAttributes( { style: newStyle } );
	};

	// Turn on contrast checker for web only since it's not supported on mobile yet.
	const enableContrastChecking =
		Platform.OS === 'web' && ! gradient && ! style?.color?.gradient;

	const textColorSettings = hasTextColorSupport( blockName )
		? [
				{
					label: __( 'Text color' ),
					onColorChange: onChangeColor( 'text' ),
					colorValue: getColorObjectByAttributeValues(
						colors,
						textColor,
						style?.color?.text
					).color,
				},
		  ]
		: [];

	const backgroundColorSettings =
		hasBackground || hasGradient
			? [
					{
						label: __( 'Background color' ),
						onColorChange: hasBackground
							? onChangeColor( 'background' )
							: undefined,
						colorValue: getColorObjectByAttributeValues(
							colors,
							backgroundColor,
							style?.color?.background
						).color,
						gradientValue,
						onGradientChange: hasGradient
							? onChangeGradient
							: undefined,
					},
			  ]
			: [];

	const linkColorSettings =
		isLinkColorEnabled && hasLinkColorSupport( blockName )
			? [
					{
						label: __( 'Link Color' ),
						onColorChange: onChangeLinkColor,
						colorValue: getLinkColorFromAttributeValue(
							colors,
							style?.elements?.link?.color?.text
						),
						clearable: !! style?.elements?.link?.color?.text,
					},
			  ]
			: [];

	const defaultColorSet = {
		label: __( 'Default colors' ),
		hasValue: () => true, // TODO: Update with check if any default colors set.
		onDeselect: resetDefaultColors, // TODO: Update with reset callback.
		isShownByDefault: true,
		checkDefaultContrast: true,
		colorSettings: [
			...textColorSettings,
			...backgroundColorSettings,
			...linkColorSettings,
		],
	};

	const onChangeSetColor = ( colorSet, name ) => ( value ) => {
		const currentStyle = localAttributes.current?.style;

		const newStyle = {
			...currentStyle,
			color: {
				...currentStyle?.color,
				sets: {
					...currentStyle?.color?.sets,
					[ colorSet ]: {
						...currentStyle?.color?.sets?.[ colorSet ],
						[ name ]: value,
					},
				},
			},
		};

		const newAttributes = { style: cleanEmptyObject( newStyle ) };

		props.setAttributes( newAttributes );
		localAttributes.current = {
			...localAttributes.current,
			...newAttributes,
		};
	};

	const customColorSets = hasColorSetsSupport( blockName )
		? getColorSets( blockName ).map( ( colorSet ) => {
				const colorSettings = [];
				const showColor = colorSet.color !== false;
				const showBackground = colorSet.background !== false;
				const colorSetValues = style?.color?.sets?.[ colorSet.slug ];

				const contrastSettings = enableContrastChecking &&
					showColor &&
					showBackground && {
						backgroundColor: colorSetValues?.background,
						textColor: colorSetValues?.color,
					};

				if ( showColor ) {
					colorSettings.push( {
						label: colorSet.colorLabel,
						onColorChange: onChangeSetColor(
							colorSet.slug,
							'color'
						),
						colorValue: colorSetValues?.color,
					} );
				}

				if ( showBackground ) {
					colorSettings.push( {
						label: colorSet.backgroundLabel,
						onColorChange: onChangeSetColor(
							colorSet.slug,
							'background'
						),
						colorValue: colorSetValues?.background,
					} );
				}

				return {
					label: colorSet.menuLabel,
					hasValue: hasSetColor( colorSet.slug ),
					onDeselect: resetColorSet( colorSet.slug ),
					colorSettings,
					contrastSettings,
				};
		  } )
		: [];

	const resetAllColors = () => {
		const newStyle = immutableSet(
			{
				...localAttributes.current.style,
				color: undefined,
			},
			[ 'elements', 'link', 'color', 'text' ],
			undefined
		);

		setAttributes( {
			backgroundColor: undefined,
			gradient: undefined,
			textColor: undefined,
			style: newStyle,
		} );
	};

	return (
		<ColorPanel
			enableContrastChecking={ enableContrastChecking }
			clientId={ props.clientId }
			colorSets={ [ defaultColorSet, ...customColorSets ] }
			attributes={ attributes }
			setAttributes={ setAttributes }
			resetAll={ resetAllColors }
		/>
	);
}

/**
 * This adds inline styles for color palette colors.
 * Ideally, this is not needed and themes should load their palettes on the editor.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
export const withColorPaletteStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { name, attributes } = props;
		const { backgroundColor, textColor } = attributes;
		const colors = useSetting( 'color.palette' ) || EMPTY_ARRAY;
		if ( ! hasColorSupport( name ) || shouldSkipSerialization( name ) ) {
			return <BlockListBlock { ...props } />;
		}

		const extraStyles = {
			color: textColor
				? getColorObjectByAttributeValues( colors, textColor )?.color
				: undefined,
			backgroundColor: backgroundColor
				? getColorObjectByAttributeValues( colors, backgroundColor )
						?.color
				: undefined,
		};

		let wrapperProps = props.wrapperProps;
		wrapperProps = {
			...props.wrapperProps,
			style: {
				...extraStyles,
				...props.wrapperProps?.style,
			},
		};

		return <BlockListBlock { ...props } wrapperProps={ wrapperProps } />;
	}
);

addFilter(
	'blocks.registerBlockType',
	'core/color/addAttribute',
	addAttributes
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/color/addSaveProps',
	addSaveProps
);

addFilter(
	'blocks.registerBlockType',
	'core/color/addEditProps',
	addEditProps
);

addFilter(
	'editor.BlockListBlock',
	'core/color/with-color-palette-styles',
	withColorPaletteStyles
);
