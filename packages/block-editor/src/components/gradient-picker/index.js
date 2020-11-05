/**
 * WordPress dependencies
 */
import { __experimentalGradientPicker as GradientPicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useEditorFeature from '../use-editor-feature';

const EMPTY_ARRAY = [];

function GradientPickerWithGradients( props ) {
	const gradients = useEditorFeature( 'color.gradients' ) || EMPTY_ARRAY;
	const disableCustomGradients = ! useEditorFeature( 'color.customGradient' );

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
