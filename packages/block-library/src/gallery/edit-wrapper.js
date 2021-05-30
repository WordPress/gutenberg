/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import GalleryEdit from './edit';
import GalleryEditV1 from './v1/edit';

/*
 * Using a wrapper around the logic to load the edit for v1 of Gallery block
 * or the refactored version with InnerBlocks. This is to prevent conditional
 * use of hooks lint errors if adding this logic to the top of the edit component.
 */
export default function GalleryEditWrapper( props ) {
	const { attributes } = props;

	const __experimentalGalleryRefactor = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return settings.__experimentalGalleryRefactor;
	}, [] );

	// This logic is used to infer version information from content with higher
	// precedence than the flag. New galleries (and existing empty galleries) will
	// honor the flag.
	const hasNewVersionContent = !! attributes?.imageCount;
	const hasOldVersionContent =
		0 < attributes?.ids?.length || 0 < attributes?.images?.length;
	if (
		hasOldVersionContent ||
		( ! hasNewVersionContent && ! __experimentalGalleryRefactor )
	) {
		return <GalleryEditV1 { ...props } />;
	}

	return <GalleryEdit { ...props } />;
}
