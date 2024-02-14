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
		const [ enableCustomColors, ...colorsFeatureByOrigin ] = useSettings(
			'color.custom',
			'color.palette.custom',
			'color.palette.theme',
			'color.palette.default'
		);
		const {
			colors = colorsFeatureByOrigin.find(
				( origin ) => origin !== undefined
			),
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
