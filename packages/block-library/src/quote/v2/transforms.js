/**
 * WordPress dependencies
 */
import { createBlock, serialize } from '@wordpress/blocks';

const transforms = {
	from: [],
	to: [
		{
			type: 'block',
			blocks: [ 'core/pullquote' ],
			isMatch: ( attributes, block ) => {
				return block.innerBlocks.every(
					( { name } ) => name === 'core/paragraph'
				);
			},
			transform: ( { attribution }, innerBlocks ) => {
				return createBlock( 'core/pullquote', {
					value: serialize( innerBlocks ),
					citation: attribution,
				} );
			},
		},
	],
};

export default transforms;
