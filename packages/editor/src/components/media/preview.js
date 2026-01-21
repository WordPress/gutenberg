/**
 * WordPress dependencies
 */
import {
	MediaPreview as BaseMediaPreview,
	MediaEditorCanvas,
	useMediaEditorContext,
} from '@wordpress/media-editor';

/**
 * Media preview component for the editor.
 * Conditionally renders MediaEditorCanvas when in editing mode,
 * otherwise shows the normal preview.
 *
 * Uses MediaEditorContext from AttachmentEditorProvider.
 *
 * @param {Object} props - Additional props to spread on MediaPreview.
 * @return {Element} The MediaPreview component.
 */
export default function MediaPreview( props ) {
	const { isEditingImage } = useMediaEditorContext();

	// If in editing mode, show the cropper canvas
	if ( isEditingImage ) {
		return <MediaEditorCanvas />;
	}

	// Otherwise show the normal preview
	return <BaseMediaPreview { ...props } />;
}
