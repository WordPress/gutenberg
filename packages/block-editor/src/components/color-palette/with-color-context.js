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
import useSetting from '../use-setting';

export default createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const colorsFeature = useSetting( 'color.palette' );
		const disableCustomColorsFeature = ! useSetting( 'color.custom' );
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
