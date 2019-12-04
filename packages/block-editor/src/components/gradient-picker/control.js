
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

export default function( { className, label = __( 'Gradient Presets' ), ...props } ) {
	const gradients = useSelect( ( select ) => (
		select( 'core/block-editor' ).getSettings().gradients
	) );
	if ( isEmpty( gradients ) ) {
		return null;
	}
	return (
		<BaseControl
			className={ classnames(
				'block-editor-gradient-picker-control',
				className
			) }
		>
			<BaseControl.VisualLabel>
				{ label }
			</BaseControl.VisualLabel>
			<GradientPicker
				className="block-editor-gradient-picker-control__gradient-picker-presets"
				gradients={ gradients }
				{ ...props }
			/>
		</BaseControl>
	);
}
