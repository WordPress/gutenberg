/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSetting from '../use-setting';

/**
 * Retrieves color and gradient related settings.
 *
 * The arrays for colors and gradients are made up of color palettes from each
 * origin i.e. "Core", "Theme", and "User".
 *
 * @return {Object} Color and gradient related settings.
 */
export default function useMultipleOriginColorsAndGradients() {
	const colorGradientSettings = {
		disableCustomColors: ! useSetting( 'color.custom' ),
		disableCustomGradients: ! useSetting( 'color.customGradient' ),
	};

	const userColors = useSetting( 'color.palette.user' );
	const themeColors = useSetting( 'color.palette.theme' );
	const coreColors = useSetting( 'color.palette.core' );
	colorGradientSettings.colors = useMemo( () => {
		const result = [];
		if ( coreColors && coreColors.length ) {
			result.push( {
				name: __( 'Core' ),
				colors: coreColors,
			} );
		}
		if ( themeColors && themeColors.length ) {
			result.push( {
				name: __( 'Theme' ),
				colors: themeColors,
			} );
		}
		if ( userColors && userColors.length ) {
			result.push( {
				name: __( 'User' ),
				colors: userColors,
			} );
		}
		return result;
	}, [ coreColors, themeColors, userColors ] );

	const userGradients = useSetting( 'color.gradients.user' );
	const themeGradients = useSetting( 'color.gradients.theme' );
	const coreGradients = useSetting( 'color.gradients.core' );
	colorGradientSettings.gradients = useMemo( () => {
		const result = [];
		if ( coreGradients && coreGradients.length ) {
			result.push( {
				name: __( 'Core' ),
				gradients: coreGradients,
			} );
		}
		if ( themeGradients && themeGradients.length ) {
			result.push( {
				name: __( 'Theme' ),
				gradients: themeGradients,
			} );
		}
		if ( userGradients && userGradients.length ) {
			result.push( {
				name: __( 'User' ),
				gradients: userGradients,
			} );
		}
		return result;
	}, [ userGradients, themeGradients, coreGradients ] );

	return colorGradientSettings;
}
