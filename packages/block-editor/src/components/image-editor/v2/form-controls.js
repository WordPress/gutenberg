/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useImageCropper } from './context';

export default function FormControls( { onCrop, onCancel } ) {
	const { state, getImageBlob, dispatch } = useImageCropper();

	async function apply() {
		const blob = await getImageBlob( state );
		onCrop?.( blob, state );
	}

	function cancel() {
		dispatch( { type: 'RESET' } );
		onCancel?.();
	}

	return (
		<>
			<ToolbarButton onClick={ apply }>{ __( 'Apply' ) }</ToolbarButton>
			<ToolbarButton onClick={ cancel }>{ __( 'Cancel' ) }</ToolbarButton>
		</>
	);
}
