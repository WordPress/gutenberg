/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'enter',
			regExp: /^```$/,
			transform: () => createBlock( 'core/code' ),
		},
		{
			type: 'block',
			blocks: [ 'core/html', 'core/paragraph' ],
			transform: ( { content } ) => {
				return createBlock( 'core/code', {
					content,
				} );
			},
		},
		{
			type: 'raw',
			isMatch: ( node ) =>
				node.nodeName === 'PRE' &&
				node.children.length === 1 &&
				node.firstChild.nodeName === 'CODE',
			schema: {
				pre: {
					children: {
						code: {
							children: {
								'#text': {},
							},
						},
					},
				},
			},
		},
	],
};

export default transforms;
