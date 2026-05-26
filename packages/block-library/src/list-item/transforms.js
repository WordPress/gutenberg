/**
 * WordPress dependencies
 */
import { createBlock, cloneBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/paragraph', 'core/heading' ],
			transform: ( attributes ) =>
				createBlock( 'core/list-item', {
					content: attributes.content,
				} ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( attributes, innerBlocks = [] ) => [
				createBlock( 'core/paragraph', attributes ),
				...innerBlocks.map( ( block ) => cloneBlock( block ) ),
			],
		},
	],
};

export default transforms;
