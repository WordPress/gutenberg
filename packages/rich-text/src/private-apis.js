/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { useRichText } from './hook';

/**
 * Private @wordpress/rich-text APIs.
 */
export const privateApis = {};
lock( privateApis, {
	useRichText,
} );
