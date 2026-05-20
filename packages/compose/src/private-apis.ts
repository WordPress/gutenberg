/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import subscribeSharedListener from './utils/subscribe-shared-listener';

/**
 * Private @wordpress/compose APIs.
 */
export const privateApis = {};
lock( privateApis, {
	subscribeSharedListener,
} );
