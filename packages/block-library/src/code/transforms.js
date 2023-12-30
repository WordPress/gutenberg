/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { create, toHTMLString } from '@wordpress/rich-text';

const transforms = {
	from: [
		{
			type: 'enter',
			regExp: /^```$/,
			transform: () => createBlock( 'core/code' ),
		},
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( { content } ) =>
				createBlock( 'core/code', { content } ),
		},
		{
			type: 'block',
			blocks: [ 'core/html' ],
			transform: ( { content: text } ) => {
				return createBlock( 'core/code', {
					// The HTML is plain text (with plain line breaks), so
					// convert it to rich text.
					content: toHTMLString( { value: create( { text } ) } ),
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
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( { content } ) =>
				createBlock( 'core/paragraph', { content } ),
		},
	],
};

export default transforms;
