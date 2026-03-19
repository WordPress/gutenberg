/**
 * WordPress dependencies
 */
import {
	MediaPreview as BaseMediaPreview,
	MediaEditorCanvas,
	useMediaEditorContext,
} from '@wordpress/media-editor';
import { useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { sidebars } from '../sidebar/constants';

/**
 * Media preview component for the editor.
 * Conditionally renders MediaEditorCanvas when in editing mode AND the Crop tab is active.
 * This allows crop edits to persist when switching between tabs.
 *
 * Uses MediaEditorContext from AttachmentEditorProvider.
 *
 * @param {Object} props - Additional props to spread on MediaPreview.
 * @return {Element} The MediaPreview component.
 */
export default function MediaPreview( props ) {
	const { isEditingImage } = useMediaEditorContext();

	const isCropTabActive = useSelect( ( select ) => {
		const activeComplementaryArea =
			select( interfaceStore ).getActiveComplementaryArea( 'core' );
		return activeComplementaryArea === sidebars.crop;
	}, [] );

	// Show canvas only when editing AND Crop tab is active
	// This preserves crop state when switching to other tabs
	if ( isEditingImage && isCropTabActive ) {
		return <MediaEditorCanvas />;
	}

	return <BaseMediaPreview { ...props } />;
}
