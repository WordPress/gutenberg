/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export function MediaUploadCheck( { fallback = null, children } ) {
	const hasUploadPermissions = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return !! getSettings().mediaUpload;
	}, [] );
	return hasUploadPermissions ? children : fallback;
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/media-upload/README.md
 */
export default MediaUploadCheck;
