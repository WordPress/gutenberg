/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';
import useColorSchemePresets from '../colors-gradients/use-color-scheme-presets';

export default createHigherOrderComponent( ( WrappedComponent ) => {
	return function WithColorContext( props ) {
		// Get the default colors, theme colors, and custom colors
		const [
			defaultColors,
			themeColors,
			customColors,
			enableCustomColors,
			enableDefaultColors,
		] = useSettings(
			'color.palette.default',
			'color.palette.theme',
			'color.palette.custom',
			'color.custom',
			'color.defaultPalette'
		);
		const { presets: currentThemeColors } = useColorSchemePresets(
			'palette',
			themeColors
		);

		const _colors = enableDefaultColors
			? [
					...( currentThemeColors || [] ),
					...( defaultColors || [] ),
					...( customColors || [] ),
			  ]
			: [ ...( currentThemeColors || [] ), ...( customColors || [] ) ];

		const { colors = _colors, disableCustomColors = ! enableCustomColors } =
			props;

		const hasColorsToChoose =
			( colors && colors.length > 0 ) || ! disableCustomColors;
		return (
			<WrappedComponent
				{ ...{
					...props,
					colors,
					disableCustomColors,
					hasColorsToChoose,
				} }
			/>
		);
	};
}, 'withColorContext' );
