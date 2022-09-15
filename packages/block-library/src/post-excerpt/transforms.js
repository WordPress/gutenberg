/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/post-content' ],
			transform: () => createBlock( 'core/post-excerpt' ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/post-content' ],
			transform: () => createBlock( 'core/post-content' ),
		},
	],
};

export default transforms;
