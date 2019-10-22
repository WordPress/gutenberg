/**
 * WordPress dependencies
 */
import { __experimentalGradientPicker } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

function GradientPickerWithGradients( props ) {
	const gradients = useSelect( ( select ) => (
		select( 'core/block-editor' ).getSettings().gradients
	) );
	return (
		<__experimentalGradientPicker
			{ ...props }
			gradients={ gradients }
		/>
	);
}

export default function( props ) {
	const ComponentToUse = props.gradients ?
		__experimentalGradientPicker :
		GradientPickerWithGradients;
	return ( <ComponentToUse { ...props } /> );
}
