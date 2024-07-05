/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { isBindingSourceActiveKey } from './store/constants';

/**
 * Private @wordpress/blocks APIs.
 */
export const privateApis = {};
lock( privateApis, {
	isBindingSourceActiveKey,
} );
