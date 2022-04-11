/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/post-comments-form' ],
			transform: ( { content } ) => {
				return createBlock( 'core/comments-query-loop', {
					content,
				} );
			},
		},
	],
};

export default transforms;
