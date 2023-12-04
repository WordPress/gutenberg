/**
 * Internal dependencies
 */
import { kebabCase } from './utils/strings';
import { lock } from './lock-unlock';

/**
 * Private @wordpress/block-editor APIs.
 */
export const privateApis = {};
lock( privateApis, {
	kebabCase,
} );
