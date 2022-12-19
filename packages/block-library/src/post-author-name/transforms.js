/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/post-author' ],
			transform: ( { textAlign } ) =>
				createBlock( 'core/post-author-name', { textAlign } ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/post-author' ],
			transform: ( { textAlign } ) =>
				createBlock( 'core/post-author', { textAlign } ),
		},
	],
};

export default transforms;
