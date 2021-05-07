/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useThemeSetting from '../use-theme-setting';

export default createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const colorsFeature = useThemeSetting( 'color.palette' );
		const disableCustomColorsFeature = ! useThemeSetting( 'color.custom' );
		const colors =
			props.colors === undefined ? colorsFeature : props.colors;
		const disableCustomColors =
			props.disableCustomColors === undefined
				? disableCustomColorsFeature
				: props.disableCustomColors;
		const hasColorsToChoose = ! isEmpty( colors ) || ! disableCustomColors;
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
