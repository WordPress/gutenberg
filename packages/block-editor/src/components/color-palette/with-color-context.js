/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';

const EMPTY_COLORS = [];

export default createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const [
			customColors,
			themeColors,
			defaultColors,
			defaultPaletteEnabled,
			enableCustomColors,
		] = useSettings(
			'color.palette.custom',
			'color.palette.theme',
			'color.palette.default',
			'color.defaultPalette',
			'color.custom'
		);

		const colorsFeature = useMemo(
			() => [
				...( customColors || EMPTY_COLORS ),
				...( themeColors || EMPTY_COLORS ),
				...( defaultColors && defaultPaletteEnabled
					? defaultColors
					: EMPTY_COLORS ),
			],
			[ customColors, themeColors, defaultColors, defaultPaletteEnabled ]
		);

		const {
			colors = colorsFeature,
			disableCustomColors = ! enableCustomColors,
		} = props;
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
