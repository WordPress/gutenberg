/**
 * WordPress dependencies
 */
import { createBlock, cloneBlock } from '@wordpress/blocks';

export default {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ '*' ],
			__experimentalConvert( blocks ) {
				return createBlock(
					'core/details',
					{},
					blocks.map( ( block ) => cloneBlock( block ) )
				);
			},
		},
	],
};
