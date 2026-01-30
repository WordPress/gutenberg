/**
 * Internal dependencies
 */
import { useMediaEditorContext } from '../media-editor-provider';
import CroppingPanel from '../cropping-panel';

/**
 * MediaEditForm component provides editing controls when in image editing mode.
 * This is a sibling component to MediaForm and only renders when editing an image.
 *
 * Crop edits are ephemeral and only applied to the preview until the attachment is saved.
 * CroppingPanel includes a "Reset all" button to discard changes.
 */
export default function MediaEditForm() {
	const { isEditingImage } = useMediaEditorContext();

	// Only render when editing an image
	if ( ! isEditingImage ) {
		return null;
	}

	return (
		<div className="media-editor-edit-form">
			<CroppingPanel />
		</div>
	);
}
