/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

export function MediaUploadCheck( { fallback = null, children } ) {
	const hasUploadPermissions = useSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		return !! getSettings().mediaUpload;
	}, [] );
	return hasUploadPermissions ? children : fallback;
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/media-upload/README.md
 */
export default MediaUploadCheck;
