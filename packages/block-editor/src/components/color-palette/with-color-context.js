/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';

export default createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		// Get the default colors, theme colors, and custom colors
		const [ defaultColors, themeColors, customColors, enableCustomColors ] =
			useSettings(
				'color.palette.default',
				'color.palette.theme',
				'color.palette.custom',
				'color.custom'
			);

		const colors = [
			...( defaultColors || [] ),
			...( themeColors || [] ),
			...( customColors || [] ),
		];

		const { disableCustomColors = ! enableCustomColors } = props;

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
