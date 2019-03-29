/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	Path,
	SVG,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/code';

export const settings = {
	title: __( 'Code' ),

	description: __( 'Display code snippets that respect your spacing and tabs.' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path d="M0,0h24v24H0V0z" fill="none" /><Path d="M9.4,16.6L4.8,12l4.6-4.6L8,6l-6,6l6,6L9.4,16.6z M14.6,16.6l4.6-4.6l-4.6-4.6L16,6l6,6l-6,6L14.6,16.6z" /></SVG>,

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
