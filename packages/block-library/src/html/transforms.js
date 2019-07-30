/**
 * WordPress dependencies
 */
import { getPhrasingContentSchema } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: ( node ) => node.nodeName === 'FIGURE' && !! node.querySelector( 'iframe' ),
			schema: {
				figure: {
					require: [ 'iframe' ],
					children: {
						iframe: {
							attributes: [ 'src', 'allowfullscreen', 'height', 'width' ],
						},
						figcaption: {
							children: getPhrasingContentSchema(),
						},
					},
				},
			},
		},
	],
};

export default transforms;
