/**
 * Internal dependencies
 */
import { convertBlockToStatic, convertBlockToReusable } from './controls';

/**
 * Returns a generator converting a reusable block into a static block.
 *
 * @param {string} clientId The client ID of the block to attach.
 */
export function* __experimentalConvertBlockToStatic( clientId ) {
	yield convertBlockToStatic( clientId );
}

/**
 * Returns a generator converting a static block into a reusable block.
 *
 * @param {string} clientIds The client IDs of the block to detach.
 */
export function* __experimentalConvertBlockToReusable( clientIds ) {
	yield convertBlockToReusable( clientIds );
}
