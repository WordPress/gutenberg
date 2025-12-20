/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { create, toHTMLString } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { getTransformedAttributes } from '../utils/get-transformed-attributes';

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
			transform: ( attributes ) => {
				const { content } = attributes;
				return createBlock( 'core/code', {
					...attributes,
					...getTransformedAttributes( attributes, 'core/code' ),
					content,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/html' ],
			transform: ( attributes ) => {
				const { content: text } = attributes;
				return createBlock( 'core/code', {
					...attributes,
					...getTransformedAttributes( attributes, 'core/code' ),
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
			transform: ( attributes ) => {
				const { content } = attributes;
				return createBlock( 'core/paragraph', {
					...getTransformedAttributes( attributes, 'core/paragraph' ),
					content,
				} );
			},
		},
	],
};

export default transforms;
