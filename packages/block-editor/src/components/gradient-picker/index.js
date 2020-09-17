/**
 * WordPress dependencies
 */
import { __experimentalGradientPicker as GradientPicker } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useEditorFeature from '../use-editor-feature';

function GradientPickerWithGradients( props ) {
	const gradients =
		useSelect(
			( select ) => select( 'core/block-editor' ).getSettings().gradients,
			[]
		) ?? [];
	const disableCustomGradients = ! useEditorFeature( 'gradient.custom' );

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
