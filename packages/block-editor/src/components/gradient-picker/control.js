/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEmpty, pick } from 'lodash';

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

export default function( {
	className,
	value,
	onChange,
	label = __( 'Gradient Presets' ),
	...props
} ) {
	const { gradients = [], disableCustomGradients } = useSelect(
		( select ) =>
			pick( select( 'core/block-editor' ).getSettings(), [
				'gradients',
				'disableCustomGradients',
			] ),
		[]
	);
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
