/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Function to register an individual block.
 *
 * @param {Object} block The block to be registered.
 *
 * @return {WPBlockType | undefined} The block, if it has been successfully registered;
 *                        otherwise `undefined`.
 */
export default function initBlock( block ) {
	if ( ! block ) {
		return;
	}
	const { metadata, settings, name } = block;
	return registerBlockType( { name, ...metadata }, settings );
}
