import { lock } from './lock-unlock';
import { NOTICE_ELEMENT } from './store/constants';

/**
 * @private
 */
export const privateApis = {};
lock( privateApis, {
	NOTICE_ELEMENT,
} );
