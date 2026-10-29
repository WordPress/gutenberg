import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import type { MediaUploadCheckProps } from './types';

export function MediaUploadCheck( {
	fallback = null,
	children,
}: MediaUploadCheckProps ) {
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
