/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useMediaEditorContext } from '../media-editor-provider';
import useImageEditing from '../../hooks/use-image-editing';
import CroppingPanel from '../cropping-panel';

export interface MediaEditFormProps {
	onCancel?: () => void;
}

/**
 * MediaEditForm component provides editing controls when in image editing mode.
 * This is a sibling component to MediaForm and only renders when editing an image.
 *
 * @param {Object}   props          - Component props
 * @param {Function} props.onCancel - Optional callback when Cancel is clicked
 */
export default function MediaEditForm( { onCancel }: MediaEditFormProps ) {
	const { isEditingImage } = useMediaEditorContext();
	const { saveEdits, cancelEdits } = useImageEditing();

	// Only render when editing an image
	if ( ! isEditingImage ) {
		return null;
	}

	const handleApply = async () => {
		await saveEdits();
	};

	const handleCancel = () => {
		cancelEdits();
		onCancel?.();
	};

	return (
		<div className="media-editor-edit-form">
			<CroppingPanel />
			<div className="media-editor-edit-form__actions">
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ handleCancel }
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ handleApply }
				>
					{ __( 'Apply' ) }
				</Button>
			</div>
		</div>
	);
}
