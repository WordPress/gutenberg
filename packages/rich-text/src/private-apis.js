/**
 * Internal dependencies
 */
import { useAnchorWithUpdate } from './component/use-anchor';
import { lock } from './lock-unlock';

/**
 * Private @wordpress/block-editor APIs.
 */
export const privateApis = {};
lock( privateApis, {
	useAnchorWithUpdate,
} );
