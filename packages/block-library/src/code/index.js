/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Code' ),

	description: __( 'Display code snippets that respect your spacing and tabs.' ),

	icon,

	supports: {
		html: false,
	},

	transforms: {
		from: [
			{
				type: 'enter',
				regExp: /^```$/,
				transform: () => createBlock( 'core/code' ),
			},
			{
				type: 'raw',
				isMatch: ( node ) => (
					node.nodeName === 'PRE' &&
					node.children.length === 1 &&
					node.firstChild.nodeName === 'CODE'
				),
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
	},

	edit,

	save( { attributes } ) {
		return <pre><code>{ attributes.content }</code></pre>;
	},
};
