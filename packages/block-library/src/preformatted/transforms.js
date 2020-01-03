/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/code', 'core/paragraph' ],
			convert: ( { attributes: { content } } ) =>
				createBlock( 'core/preformatted', {
					content,
				} ),
		},
		{
			type: 'raw',
			isMatch: ( node ) => (
				node.nodeName === 'PRE' &&
				! (
					node.children.length === 1 &&
					node.firstChild.nodeName === 'CODE'
				)
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
			convert: ( block ) =>
				createBlock( 'core/paragraph', block.attributes ),
		},
	],
};

export default transforms;
