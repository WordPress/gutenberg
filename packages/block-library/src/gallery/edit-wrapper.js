/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import EditWithInnerBlocks from './edit';
import EditWithoutInnerBlocks from './v1/edit';

/*
 * Using a wrapper around the logic to load the edit for v1 of Gallery block
 * or the refactored version with InnerBlocks. This is to prevent conditional
 * use of hooks lint errors if adding this logic to the top of the edit component.
 */
export default function GalleryEditWrapper( props ) {
	const { attributes, clientId } = props;

	const innerBlockImages = useSelect(
		( select ) => {
			return select( blockEditorStore ).getBlock( clientId )?.innerBlocks;
		},
		[ clientId ]
	);

	const __unstableGalleryWithImageBlocks = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return settings.__unstableGalleryWithImageBlocks;
	}, [] );

	// This logic is used to infer version information from content with higher
	// precedence than the flag. New galleries (and existing empty galleries) will
	// honor the flag.
	const hasNewVersionContent = !! innerBlockImages?.length;
	const hasOldVersionContent =
		0 < attributes?.ids?.length || 0 < attributes?.images?.length;
	if (
		hasOldVersionContent ||
		( ! hasNewVersionContent && ! __unstableGalleryWithImageBlocks )
	) {
		return <EditWithoutInnerBlocks { ...props } />;
	}

	return <EditWithInnerBlocks { ...props } />;
}
