/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

const ALLOWED_BLOCKS_GRADIENT_SUPPORT = [ 'core/button' ];

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
	const { supports } = metadata;

	return registerBlockType(
		{
			name,
			...metadata,
			// Gradients support only available for blocks listed in ALLOWED_BLOCKS_GRADIENT_SUPPORT.
			...( ! ALLOWED_BLOCKS_GRADIENT_SUPPORT.includes( name ) &&
			supports?.color?.gradients
				? {
						supports: {
							...supports,
							color: { ...supports.color, gradients: false },
						},
				  }
				: {} ),
		},
		settings
	);
}
