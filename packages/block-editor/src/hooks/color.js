/**
 * External dependencies
 */
import classnames from 'classnames';
import { isObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport, getBlockSupport } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useRef, useEffect, Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
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

export const COLOR_SUPPORT_KEY = '__experimentalColor';

const hasColorSupport = ( blockType ) =>
	Platform.OS === 'web' && hasBlockSupport( blockType, COLOR_SUPPORT_KEY );

const hasGradientSupport = ( blockType ) => {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return isObject( colorSupport ) && !! colorSupport.gradients;
};

/**
 * Filters registered block settings, extending attributes to include
 * `backgroundColor` and `textColor` attribute.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
function addAttributes( settings ) {
	if ( ! hasColorSupport( settings ) ) {
		return settings;
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
 * @param  {Object} props      Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @param  {Object} attributes Block attributes
 * @return {Object}            Filtered props applied to save element
 */
export function addSaveProps( props, blockType, attributes ) {
	if ( ! hasColorSupport( blockType ) ) {
		return props;
	}

	const hasGradient = hasGradientSupport( blockType );

	// I'd have prefered to avoid the "style" attribute usage here
	const { gradient, style } = attributes;

	const gradientClass = __experimentalGetGradientClass( gradient );
	const newClassName = classnames( props.className, gradientClass, {
		'has-text-color': style?.color?.text,
		'has-background':
			style?.color?.background ||
			( hasGradient && ( gradient || style?.color?.gradient ) ),
	} );
	props.className = newClassName ? newClassName : undefined;

	return props;
}

/**
 * Filters registered block settings to extand the block edit wrapper
 * to apply the desired styles and classnames properly.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
export function addEditProps( settings ) {
	if ( ! hasColorSupport( settings ) ) {
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

const getColorFromAttributeValue = ( colors, attributeValue ) => {
	const attributeParsed = /var\(--wp--colors--(.*)\)/.exec( attributeValue );
	return getColorObjectByAttributeValues(
		colors,
		attributeParsed && attributeParsed[ 1 ],
		attributeValue
	).color;
};
/**
 * Inspector control panel containing the color related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Color edit element.
 */
export function ColorEdit( props ) {
	const { name: blockName, attributes } = props;
	const { colors, gradients } = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSettings();
	}, [] );
	// Shouldn't be needed but right now the ColorGradientsPanel
	// can trigger both onChangeColor and onChangeBackground
	// synchronously causing our two callbacks to override changes
	// from each other.
	const localAttributes = useRef( attributes );
	useEffect( () => {
		localAttributes.current = attributes;
	}, [ attributes ] );

	if ( ! hasColorSupport( blockName ) ) {
		return null;
	}

	const hasGradient = hasGradientSupport( blockName );

	const { style, gradient } = attributes;
	let gradientValue;
	if ( hasGradient && gradient ) {
		gradientValue = getGradientValueBySlug( gradients, gradient );
	} else if ( hasGradient ) {
		gradientValue = style?.color?.gradient;
	}

	const onChangeColor = ( name ) => ( value ) => {
		const colorObject = getColorObjectByColorValue( colors, value );
		const newStyle = {
			...localAttributes.current.style,
			color: {
				...localAttributes.current?.style?.color,
				[ name ]: colorObject?.slug
					? `var(--wp--colors--${ colorObject?.slug })`
					: value,
			},
		};

		const newAttributes = {
			style: cleanEmptyObject( newStyle ),
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

	return (
		<ColorPanel
			enableContrastChecking={
				// Turn on contrast checker for web only since it's not supported on mobile yet.
				Platform.OS === 'web' && ! gradient && ! style?.color?.gradient
			}
			clientId={ props.clientId }
			settings={ [
				{
					label: __( 'Text Color' ),
					onColorChange: onChangeColor( 'text' ),
					colorValue: getColorFromAttributeValue(
						colors,
						style?.color?.text
					),
				},
				{
					label: __( 'Background Color' ),
					onColorChange: onChangeColor( 'background' ),
					colorValue: getColorFromAttributeValue(
						colors,
						style?.color?.background
					),
					gradientValue,
					onGradientChange: hasGradient
						? onChangeGradient
						: undefined,
				},
			] }
		/>
	);
}

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
