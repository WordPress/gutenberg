import type { MediaItem } from '../types';

/**
 * An attachment record with the folder term ids the REST API exposes under
 * the `rest_base` of the taxonomy.
 *
 * It is declared here rather than on `MediaItem`, since the property only
 * exists while the media folders experiment is on.
 */
export interface MediaItemWithFolders extends MediaItem {
	'media-folders'?: number[];
}
