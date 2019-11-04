
/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { BaseControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import GradientPicker from './';

export default function( { className, ...props } ) {
	return (
		<BaseControl
			className={ classnames(
				'block-editor-gradient-picker-control',
				className
			) }
		>
			<BaseControl.VisualLabel>
				{ __( 'Gradient Presets' ) }
			</BaseControl.VisualLabel>
			<GradientPicker
				className="block-editor-gradient-picker-control__gradient-picker-presets"
				{ ...props }
			/>
		</BaseControl>
	);
}
