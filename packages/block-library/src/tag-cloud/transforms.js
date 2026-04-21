/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/categories' ],
			transform: () => createBlock( 'core/tag-cloud' ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/categories' ],
			transform: () => createBlock( 'core/categories' ),
		},
	],
};

export default transforms;
