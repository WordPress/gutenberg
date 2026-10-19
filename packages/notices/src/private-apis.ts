import { lock } from './lock-unlock';
import { createNoticeContentFill } from './components/notice-content';

/**
 * @private
 */
export const privateApis = {};
lock( privateApis, {
	createNoticeContentFill,
} );
