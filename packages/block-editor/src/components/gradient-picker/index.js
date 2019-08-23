/**
 * WordPress dependencies
 */
import { GradientPicker } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

function GradientPickerWithGradients( props ) {
	const gradients = useSelect( ( select ) => (
		select( 'core/block-editor' ).getSettings().gradients
	) );
	return (
		<GradientPicker
			{ ...props }
			gradients={ gradients }
		/>
	);
}

export default function( props ) {
	const ComponentToUse = props.gradients ?
		GradientPicker :
		GradientPickerWithGradients;
	return ( <ComponentToUse { ...props } /> );
}
