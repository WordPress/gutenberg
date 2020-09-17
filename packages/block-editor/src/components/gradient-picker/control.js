/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { BaseControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import GradientPicker from './';
import useEditorFeature from '../use-editor-feature';

export default function GradientPickerControl( {
	className,
	value,
	onChange,
	label = __( 'Gradient Presets' ),
	...props
} ) {
	const gradients =
		useSelect(
			( select ) => select( 'core/block-editor' ).getSettings().gradients,
			[]
		) ?? [];
	const disableCustomGradients = ! useEditorFeature( 'gradient.custom' );
	if ( isEmpty( gradients ) && disableCustomGradients ) {
		return null;
	}
	return (
		<BaseControl
			className={ classnames(
				'block-editor-gradient-picker-control',
				className
			) }
		>
			<BaseControl.VisualLabel>{ label }</BaseControl.VisualLabel>
			<GradientPicker
				value={ value }
				onChange={ onChange }
				className="block-editor-gradient-picker-control__gradient-picker-presets"
				gradients={ gradients }
				disableCustomGradients={ disableCustomGradients }
				{ ...props }
			/>
		</BaseControl>
	);
}
