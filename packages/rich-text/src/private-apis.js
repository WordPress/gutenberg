/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { useRichText } from './hook';
import { subscribeSharedListener } from './hook/event-listeners/shared-listener';

/**
 * Private @wordpress/rich-text APIs.
 */
export const privateApis = {};
lock( privateApis, {
	useRichText,
	subscribeSharedListener,
} );
