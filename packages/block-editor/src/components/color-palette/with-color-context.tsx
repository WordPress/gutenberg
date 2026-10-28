import type { ComponentType } from 'react';
import { createHigherOrderComponent } from '@wordpress/compose';
import type { Color } from '@wordpress/global-styles-engine';
import { useSettings } from '../use-settings';
import type { WithColorContextProps } from './types';

type Inner = ComponentType< WithColorContextProps >;
type Palette = Color[] | undefined;

export default createHigherOrderComponent( ( WrappedComponent: Inner ) => {
	return function WithColorContext( props: WithColorContextProps ) {
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

		// The settings list the palettes' colors.
		const _colors = enableDefaultColors
			? [
					...( ( themeColors as Palette ) || [] ),
					...( ( defaultColors as Palette ) || [] ),
					...( ( customColors as Palette ) || [] ),
				]
			: [
					...( ( themeColors as Palette ) || [] ),
					...( ( customColors as Palette ) || [] ),
				];

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
