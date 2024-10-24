/**
 * Internal dependencies
 */
import { sideloadMedia } from './utils/sideload-media';
import { lock } from './lock-unlock';

/**
 * Private @wordpress/media-utils APIs.
 */
export const privateApis = {};

lock( privateApis, {
	sideloadMedia,
} );
