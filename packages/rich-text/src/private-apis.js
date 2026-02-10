/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { useRichText } from './component';

/**
 * Private @wordpress/rich-text APIs.
 */
export const privateApis = {};
lock( privateApis, {
	useRichText,
} );
