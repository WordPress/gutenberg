/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/post-comments-count' ],
			transform: ( { textAlign } ) => {
				return createBlock( 'core/post-comments-count', {
					textAlign,
				} );
			},
		},
	],
};

export default transforms;
