/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
	getGradientValueBySlug,
	getGradientSlugByValue,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
} from '@wordpress/block-editor';

function OverlayColorSettings( { attributes, setAttributes } ) {
	const { colors, gradients } = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSettings();
	}, [] );

	const {
		overlayColor,
		customOverlayColor,
		gradient,
		customGradient,
	} = attributes;

	const gradientValue =
		customGradient || getGradientValueBySlug( gradients, gradient );

	const colorValue = getColorObjectByAttributeValues(
		colors,
		overlayColor,
		customOverlayColor
	).color;

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

	return (
		<PanelColorGradientSettings
			title={ __( 'Color settings' ) }
			initialOpen={ false }
			settings={ [
				{
					label: __( 'Overlay Color' ),
					onColorChange,
					colorValue,
					gradientValue,
					onGradientChange,
				},
			] }
		/>
	);
}

export default OverlayColorSettings;
