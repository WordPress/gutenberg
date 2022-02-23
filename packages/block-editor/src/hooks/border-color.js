/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorGradientSettingsDropdown from '../components/colors-gradients/dropdown';
import useMultipleOriginColorsAndGradients from '../components/colors-gradients/use-multiple-origin-colors-and-gradients';
import {
	getColorClassName,
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
} from '../components/colors';
import useSetting from '../components/use-setting';
import {
	hasBorderSupport,
	removeBorderAttribute,
	shouldSkipSerialization,
} from './border';
import { cleanEmptyObject } from './utils';

// Defining empty array here instead of inline avoids unnecessary re-renders of
// color control.
const EMPTY_ARRAY = [];

/**
 * Inspector control panel containing the border color related configuration.
 *
 * There is deliberate overlap between the colors and borders block supports
 * relating to border color. It can be argued the border color controls could
 * be included within either, or both, the colors and borders panels in the
 * inspector controls. If they share the same block attributes it should not
 * matter.
 *
 * @param {Object} props Block properties.
 *
 * @return {WPElement} Border color edit element.
 */
export function BorderColorEdit( props ) {
	const {
		attributes: { borderColor, style },
		setAttributes,
	} = props;
	const colorGradientSettings = useMultipleOriginColorsAndGradients();
	const availableColors = colorGradientSettings.colors.reduce(
		( colors, origin ) => colors.concat( origin.colors ),
		[]
	);
	const { color: customBorderColor } = style?.border || {};
	const [ colorValue, setColorValue ] = useState(
		() =>
			getColorObjectByAttributeValues(
				availableColors,
				borderColor,
				customBorderColor
			)?.color
	);

	// Detect changes in the color attributes and update the colorValue to keep the
	// UI in sync. This is necessary for situations when border controls interact with
	// each other: eg, setting the border width to zero causes the color and style
	// selections to be cleared.
	useEffect( () => {
		setColorValue(
			getColorObjectByAttributeValues(
				availableColors,
				borderColor,
				customBorderColor
			)?.color
		);
	}, [ borderColor, customBorderColor, availableColors ] );

	const onChangeColor = ( value ) => {
		setColorValue( value );

		const colorObject = getColorObjectByColorValue(
			availableColors,
			value
		);
		const newStyle = {
			...style,
			border: {
				...style?.border,
				color: colorObject?.slug ? undefined : value,
			},
		};

		// If empty slug, ensure undefined to remove attribute.
		const newNamedColor = colorObject?.slug ? colorObject.slug : undefined;

		setAttributes( {
			style: cleanEmptyObject( newStyle ),
			borderColor: newNamedColor,
		} );
	};

	const settings = [
		{
			label: __( 'Color' ),
			onColorChange: onChangeColor,
			colorValue,
			clearable: false,
		},
	];
	return (
		<ColorGradientSettingsDropdown
			settings={ settings }
			disableCustomColors
			disableCustomGradients
			__experimentalHasMultipleOrigins
			__experimentalIsRenderedInSidebar
			enableAlpha
			{ ...colorGradientSettings }
		/>
	);
}

/**
 * Checks if there is a current value in the border color block support
 * attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a border color value set.
 */
export function hasBorderColorValue( props ) {
	const {
		attributes: { borderColor, style },
	} = props;

	return !! borderColor || !! style?.border?.color;
}

/**
 * Resets the border color block support attributes. This can be used when
 * disabling the border color support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetBorderColor( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		borderColor: undefined,
		style: removeBorderAttribute( style, 'color' ),
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
		shouldSkipSerialization( blockType )
	) {
		return props;
	}

	const { borderColor, style } = attributes;
	const borderColorClass = getColorClassName( 'border-color', borderColor );

	const newClassName = classnames( props.className, {
		'has-border-color': borderColor || style?.border?.color,
		[ borderColorClass ]: !! borderColorClass,
	} );

	// If we are clearing the last of the previous classes in `className`
	// set it to `undefined` to avoid rendering empty DOM attributes.
	props.className = newClassName ? newClassName : undefined;

	return props;
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
		const { borderColor } = attributes;
		const colors = useSetting( 'color.palette' ) || EMPTY_ARRAY;

		if (
			! hasBorderSupport( name, 'color' ) ||
			shouldSkipSerialization( name )
		) {
			return <BlockListBlock { ...props } />;
		}

		const extraStyles = {
			borderColor: borderColor
				? getColorObjectByAttributeValues( colors, borderColor )?.color
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
