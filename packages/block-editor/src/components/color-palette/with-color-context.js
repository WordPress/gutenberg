/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-setting';

export default createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const [ colorsFeature, enableCustomColors ] = useSettings( [
			'color.palette',
			'color.custom',
		] );
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
