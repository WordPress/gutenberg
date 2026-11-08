import { lock } from './lock-unlock';
import { NOTICE_SLOT } from './store/constants';

/**
 * @private
 */
export const privateApis = {};
lock( privateApis, {
	NOTICE_SLOT,
} );
