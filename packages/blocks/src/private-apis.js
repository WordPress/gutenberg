/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { getClipboardEventData } from './api/raw-handling/get-clipboard-event-data';

/**
 * Private @wordpress/blocks APIs.
 */
export const privateApis = {};
lock( privateApis, {
	getClipboardEventData,
} );
