/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { create, toHTMLString } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { getTransformedMetadata } from '../utils/get-transformed-metadata';

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
			transform: ( { content, metadata } ) =>
				createBlock( 'core/code', {
					content,
					metadata: getTransformedMetadata( metadata, 'core/code' ),
				} ),
		},
		{
			type: 'block',
			blocks: [ 'core/html' ],
			transform: ( { content: text, metadata } ) => {
				return createBlock( 'core/code', {
					// The HTML is plain text (with plain line breaks), so
					// convert it to rich text.
					content: toHTMLString( { value: create( { text } ) } ),
					metadata: getTransformedMetadata( metadata, 'core/code' ),
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
			transform: ( { content, metadata } ) =>
				createBlock( 'core/paragraph', {
					content,
					metadata: getTransformedMetadata(
						metadata,
						'core/paragraph'
					),
				} ),
		},
	],
};

export default transforms;
