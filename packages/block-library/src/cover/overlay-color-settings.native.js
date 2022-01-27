/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
	getGradientValueBySlug,
	getGradientSlugByValue,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	useSetting,
} from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

function OverlayColorSettings( {
	overlayColor,
	customOverlayColor,
	gradient,
	customGradient,
	setAttributes,
} ) {
	const EMPTY_ARRAY = [];
	const colors = useSetting( 'color.palette' ) || EMPTY_ARRAY;
	const gradients = useSetting( 'color.gradients' ) || EMPTY_ARRAY;

	const gradientValue =
		customGradient || getGradientValueBySlug( gradients, gradient );

	const colorValue = getColorObjectByAttributeValues(
		colors,
		overlayColor,
		customOverlayColor
	).color;

	const settings = useMemo( () => {
		const setOverlayAttribute = ( attributeName, value ) => {
			setAttributes( {
				// clear all related attributes (only one should be set)
				overlayColor: undefined,
				customOverlayColor: undefined,
				gradient: undefined,
				customGradient: undefined,
				[ attributeName ]: value,
			} );
		};

		const onColorChange = ( value ) => {
			// do nothing for falsy values
			if ( ! value ) {
				return;
			}
			const colorObject = getColorObjectByColorValue( colors, value );
			if ( colorObject?.slug ) {
				setOverlayAttribute( 'overlayColor', colorObject.slug );
			} else {
				setOverlayAttribute( 'customOverlayColor', value );
			}
		};

		const onGradientChange = ( value ) => {
			// do nothing for falsy values
			if ( ! value ) {
				return;
			}
			const slug = getGradientSlugByValue( gradients, value );
			if ( slug ) {
				setOverlayAttribute( 'gradient', slug );
			} else {
				setOverlayAttribute( 'customGradient', value );
			}
		};

		const onColorCleared = () => {
			setAttributes( {
				overlayColor: undefined,
				customOverlayColor: undefined,
				gradient: undefined,
				customGradient: undefined,
			} );
		};

		return [
			{
				label: __( 'Color' ),
				onColorChange,
				colorValue,
				gradientValue,
				onGradientChange,
				onColorCleared,
			},
		];
	}, [ colorValue, gradientValue, colors, gradients ] );

	return (
		<PanelColorGradientSettings
			title={ __( 'Overlay' ) }
			initialOpen={ false }
			settings={ settings }
		/>
	);
}

export default OverlayColorSettings;
