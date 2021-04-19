/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import useEditorFeature from '../use-editor-feature';
import { store as blockEditorStore } from '../../store';

export default createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const colorsFeature = useEditorFeature( 'color.palette' );
		const { colorPickerMode } = useSelect( ( select ) => {
			return select( blockEditorStore ).getSettings();
		} );
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
