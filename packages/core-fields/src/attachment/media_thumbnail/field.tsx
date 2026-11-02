import type { FieldsScriptParts } from '../../types';
import type { MediaItem } from '../types';
import MediaThumbnailView from './view';

/**
 * The JavaScript parts of the thumbnail field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< MediaItem >[ string ] = {
	render: MediaThumbnailView,
};
