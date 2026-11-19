import { registerBlockType } from '@wordpress/blocks';
import type { BlockConfiguration, BlockType } from '@wordpress/blocks';

type BlockToRegister = {
	name: string;
	metadata: object;
	settings: object;
};

/**
 * Function to register an individual block.
 *
 * @param block The block to be registered.
 *
 * @return The block, if it has been successfully registered;
 *         otherwise `undefined`.
 */
export default function initBlock(
	block?: BlockToRegister
): BlockType | undefined {
	if ( ! block ) {
		return;
	}
	const { metadata, settings, name } = block;
	return registerBlockType(
		{ name, ...metadata } as BlockConfiguration,
		settings as Partial< BlockConfiguration >
	);
}
