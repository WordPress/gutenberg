/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';
import useColorSchemePresets from './use-color-scheme-presets';

/**
 * Retrieves color and gradient related settings.
 *
 * The arrays for colors and gradients are made up of color palettes from each
 * origin i.e. "Core", "Theme", and "User".
 *
 * @return {Object} Color and gradient related settings.
 */
export default function useMultipleOriginColorsAndGradients() {
	const [
		enableCustomColors,
		customColors,
		themeColors,
		defaultColors,
		shouldDisplayDefaultColors,
		enableCustomGradients,
		customGradients,
		themeGradients,
		defaultGradients,
		shouldDisplayDefaultGradients,
	] = useSettings(
		'color.custom',
		'color.palette.custom',
		'color.palette.theme',
		'color.palette.default',
		'color.defaultPalette',
		'color.customGradient',
		'color.gradients.custom',
		'color.gradients.theme',
		'color.gradients.default',
		'color.defaultGradients'
	);

	const colorGradientSettings = {
		disableCustomColors: ! enableCustomColors,
		disableCustomGradients: ! enableCustomGradients,
	};
	const { presets: currentThemeColors, hasColorSchemes } =
		useColorSchemePresets( 'palette', themeColors );
	const { presets: currentThemeGradients } = useColorSchemePresets(
		'gradients',
		themeGradients
	);
	colorGradientSettings.hasColorSchemes = hasColorSchemes;

	colorGradientSettings.colors = useMemo( () => {
		const result = [];
		if ( currentThemeColors && currentThemeColors.length ) {
			result.push( {
				name: _x(
					'Theme',
					'Indicates this palette comes from the theme.'
				),
				slug: 'theme',
				colors: currentThemeColors,
			} );
		}
		if (
			shouldDisplayDefaultColors &&
			defaultColors &&
			defaultColors.length
		) {
			result.push( {
				name: _x(
					'Default',
					'Indicates this palette comes from WordPress.'
				),
				slug: 'default',
				colors: defaultColors,
			} );
		}
		if ( customColors && customColors.length ) {
			result.push( {
				name: _x(
					'Custom',
					'Indicates this palette is created by the user.'
				),
				slug: 'custom',
				colors: customColors,
			} );
		}
		return result;
	}, [
		customColors,
		currentThemeColors,
		defaultColors,
		shouldDisplayDefaultColors,
	] );

	colorGradientSettings.gradients = useMemo( () => {
		const result = [];
		if ( currentThemeGradients && currentThemeGradients.length ) {
			result.push( {
				name: _x(
					'Theme',
					'Indicates this palette comes from the theme.'
				),
				slug: 'theme',
				gradients: currentThemeGradients,
			} );
		}
		if (
			shouldDisplayDefaultGradients &&
			defaultGradients &&
			defaultGradients.length
		) {
			result.push( {
				name: _x(
					'Default',
					'Indicates this palette comes from WordPress.'
				),
				slug: 'default',
				gradients: defaultGradients,
			} );
		}
		if ( customGradients && customGradients.length ) {
			result.push( {
				name: _x(
					'Custom',
					'Indicates this palette is created by the user.'
				),
				slug: 'custom',
				gradients: customGradients,
			} );
		}
		return result;
	}, [
		customGradients,
		currentThemeGradients,
		defaultGradients,
		shouldDisplayDefaultGradients,
	] );

	colorGradientSettings.hasColorsOrGradients =
		!! colorGradientSettings.colors.length ||
		!! colorGradientSettings.gradients.length;

	return colorGradientSettings;
}
