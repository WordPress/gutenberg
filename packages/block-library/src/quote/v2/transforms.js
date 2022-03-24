/**
 * WordPress dependencies
 */
import { createBlock, serialize } from '@wordpress/blocks';

const transforms = {
	from: [],
	to: [
		{
			type: 'block',
			blocks: [ 'core/group' ],
			transform: ( { attribution }, innerBlocks ) =>
				createBlock(
					'core/group',
					{},
					attribution
						? [
								...innerBlocks,
								createBlock( 'core/paragraph', {
									content: attribution,
								} ),
						  ]
						: innerBlocks
				),
		},
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
