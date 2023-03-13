/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/code', 'core/paragraph' ],
			transform: ( { content, anchor } ) =>
				createBlock( 'core/preformatted', {
					content,
					anchor,
				} ),
		},
		{
			type: 'raw',
			isMatch: ( node ) =>
				node.nodeName === 'PRE' &&
				! (
					node.children.length === 1 &&
					node.firstChild.nodeName === 'CODE'
				),
			schema: ( { phrasingContentSchema } ) => ( {
				pre: {
					children: phrasingContentSchema,
				},
			} ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) =>
				createBlock( 'core/paragraph', {
					...attributes,
					content: attributes.content.replace( /\n/g, '<br>' ),
				} ),
		},
		{
			type: 'block',
			blocks: [ 'core/code' ],
			transform: ( attributes ) => createBlock( 'core/code', attributes ),
		},
	],
};

export default transforms;
