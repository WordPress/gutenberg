/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

export function MediaUploadCheck( { hasUploadPermissions, fallback = null, children } ) {
	return hasUploadPermissions ? children : fallback;
}

export default withSelect( ( select ) => {
	const { getSettings } = select( 'core/block-editor' );

	return {
		hasUploadPermissions: !! getSettings().__experimentalMediaUpload,
	};
} )( MediaUploadCheck );
