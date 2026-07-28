/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import subscribeDelegatedListener from './utils/subscribe-delegated-listener';

/**
 * Private @wordpress/compose APIs.
 */
export const privateApis = {};
lock( privateApis, {
	subscribeDelegatedListener,
} );
