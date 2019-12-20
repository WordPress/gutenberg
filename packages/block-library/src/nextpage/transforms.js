/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'raw',
			schema: {
				'wp-block': { attributes: [ 'data-block' ] },
			},
			isMatch: ( node ) => node.dataset && node.dataset.block === 'core/nextpage',
			transform() {
				return createBlock( 'core/nextpage', {} );
			},
		},
	],
};

export default transforms;
