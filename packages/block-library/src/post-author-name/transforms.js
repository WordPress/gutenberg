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
				createBlock( 'core/post-author-name', {
					style: { typography: { textAlign } },
				} ),
		},
	],
};

export default transforms;
