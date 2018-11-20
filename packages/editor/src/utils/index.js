/**
 * Internal dependencies
 */
import mediaUpload from './media-upload';
import { getBlockWidth } from './dom';

export { mediaUpload };
export { cleanForSlug } from './url.js';

export const __unstableDOM = {
	getBlockWidth,
};
