/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { sideloadMedia: mediaSideload } = unlock( privateApis );

export default mediaSideload;
