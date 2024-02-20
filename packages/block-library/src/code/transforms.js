/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { create, toHTMLString } from '@wordpress/rich-text';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { getTransformedMetadata } = unlock( blockEditorPrivateApis );

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
					metadata: getTransformedMetadata( metadata, [
						'id',
						'name',
					] ),
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
					metadata: getTransformedMetadata( metadata, [
						'id',
						'name',
					] ),
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
					metadata: getTransformedMetadata( metadata, [
						'id',
						'name',
					] ),
				} ),
		},
	],
};

export default transforms;
