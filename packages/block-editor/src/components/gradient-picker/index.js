/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { __experimentalGradientPicker as GradientPicker } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

function GradientPickerWithGradients( props ) {
	const { gradients, disableCustomGradients } = useSelect(
		( select ) =>
			pick( select( 'core/block-editor' ).getSettings(), [
				'gradients',
				'disableCustomGradients',
			] ),
		[]
	);
	return (
		<GradientPicker
			gradients={
				props.gradients !== undefined ? props.gradient : gradients
			}
			disableCustomGradients={
				props.disableCustomGradients !== undefined
					? props.disableCustomGradients
					: disableCustomGradients
			}
			{ ...props }
		/>
	);
}

export default function ( props ) {
	const ComponentToUse =
		props.gradients !== undefined &&
		props.disableCustomGradients !== undefined
			? GradientPicker
			: GradientPickerWithGradients;
	return <ComponentToUse { ...props } />;
}
