/**
 * WordPress dependencies
 */
import { MediaEditForm, useMediaEditorContext } from '@wordpress/media-editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PostPanelSection from '../post-panel-section';

/**
 * Media crop panel for the editor sidebar.
 * Displays the editing controls (zoom, rotate, flip, aspect ratio).
 * The actual cropper canvas is rendered in the main editor area via MediaPreview.
 *
 * @return {Element} The MediaCropPanel component.
 */
export default function MediaCropPanel() {
	return (
		<PostPanelSection className="editor-media-crop-panel">
			<MediaCropPanelContent />
		</PostPanelSection>
	);
}

/**
 * Internal component that has access to MediaEditorContext.
 * Sets editing mode when the panel is mounted.
 * Crop edits persist across tab switches and are ephemeral until the attachment is saved.
 */
function MediaCropPanelContent() {
	const { setIsEditingImage } = useMediaEditorContext();

	// Engage editing mode when this panel is shown
	useEffect( () => {
		setIsEditingImage( true );
		// Intentionally no cleanup - preserves crop state when switching tabs
		// Crop edits remain ephemeral until the attachment is saved
	}, [ setIsEditingImage ] );

	// Only render the controls panel - the canvas is rendered in MediaPreview
	return <MediaEditForm />;
}
