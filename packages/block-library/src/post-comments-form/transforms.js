/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/comments-query-loop' ],
			transform: ( { content } ) => {
				return createBlock( 'core/post-comments-form', {
					content,
				} );
			},
		},
	],
};

export default transforms;
