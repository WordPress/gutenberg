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
import useEditorFeature from '../use-editor-feature';

export default createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const colorsFeature = useEditorFeature( 'color.palette' );
		const colorPickerMode = useEditorFeature( 'color.pickerMode' );
		const disableCustomColorsFeature = ! useEditorFeature( 'color.custom' );
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
					colorPickerMode,
					disableCustomColors,
					hasColorsToChoose,
				} }
			/>
		);
	};
}, 'withColorContext' );
