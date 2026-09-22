import { privateApis } from '@wordpress/media-utils';
import { unlock } from '../../lock-unlock';

const { sideloadMedia: mediaSideload } = unlock( privateApis );

export default mediaSideload;
