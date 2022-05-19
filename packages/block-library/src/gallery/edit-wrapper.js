/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withNotices } from '@wordpress/components';

/**
 * Internal dependencies
 */
import EditWithInnerBlocks from './edit';
import EditWithoutInnerBlocks from './v1/edit';
import { isGalleryV2Enabled } from './shared';

/*
 * Using a wrapper around the logic to load the edit for v1 of Gallery block
 * or the refactored version with InnerBlocks. This is to prevent conditional
 * use of hooks lint errors if adding this logic to the top of the edit component.
 */
function GalleryEditWrapper( props ) {
	if ( ! isGalleryV2Enabled() ) {
		return <EditWithoutInnerBlocks { ...props } />;
	}

	return <EditWithInnerBlocks { ...props } />;
}

export default compose( [ withNotices ] )( GalleryEditWrapper );
