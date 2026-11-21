import { registerBlockType } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import type { BlockModule } from './types';

/**
 * Function to register an individual block.
 *
 * @param block The block to be registered.
 *
 * @return The block, if it has been successfully registered;
 *                        otherwise `undefined`.
 */
export default function initBlock(
	block: BlockModule | undefined
): BlockType | undefined {
	if ( ! block ) {
		return;
	}
	const { metadata, settings, name } = block;
	return registerBlockType( { name, ...metadata }, settings );
}
