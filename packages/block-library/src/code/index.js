/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/code';

export const settings = {
	title: __( 'Code' ),

	description: __( 'Add text that respects your spacing and tabs -- perfect for displaying code.' ),

	icon: <svg height="36" width="36" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g><path d="M23 12l-5.45 6.5L16 17.21 20.39 12 16 6.79l1.55-1.29zM8 6.79L6.45 5.5 1 12l5.45 6.5L8 17.21 3.61 12zm.45 14.61l1.93.52L15.55 2.6l-1.93-.52z"/></g></svg>,

	category: 'formatting',

	attributes: {
		content: {
			type: 'string',
			source: 'text',
			selector: 'code',
		},
	},

	supports: {
		html: false,
	},

	transforms: {
		from: [
			{
				type: 'pattern',
				trigger: 'enter',
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
