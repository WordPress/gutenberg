/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/post-comments-link' ],
			transform: ( { textAlign } ) => {
				return createBlock( 'core/post-comments-link', {
					style: { typography: { textAlign } },
				} );
			},
		},
	],
};

export default transforms;
