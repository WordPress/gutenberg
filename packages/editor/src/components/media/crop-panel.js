/**
 * WordPress dependencies
 */
import { MediaEditForm, useMediaEditorContext } from '@wordpress/media-editor';
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import PostPanelSection from '../post-panel-section';
import { sidebars } from '../sidebar/constants';

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
 * Sets editing mode when the panel is mounted and clears it when unmounted.
 */
function MediaCropPanelContent() {
	const { setIsEditingImage } = useMediaEditorContext();
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	// Engage editing mode when this panel is shown
	useEffect( () => {
		setIsEditingImage( true );

		// Clean up: exit editing mode when unmounting
		return () => {
			setIsEditingImage( false );
		};
	}, [ setIsEditingImage ] );

	const handleCancel = () => {
		// Switch back to the Document tab
		enableComplementaryArea( 'core', sidebars.document );
	};

	// Only render the controls panel - the canvas is rendered in MediaPreview
	return <MediaEditForm onCancel={ handleCancel } />;
}
