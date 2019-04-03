/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getPhrasingContentSchema } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

export const name = 'core/html';

export const settings = {
	title: __( 'Custom HTML' ),

	description: __( 'Add custom HTML code and preview it as you edit.' ),

	icon,

	category: 'formatting',

	keywords: [ __( 'embed' ) ],

	supports: {
		customClassName: false,
		className: false,
		html: false,
	},

	attributes: {
		content: {
			type: 'string',
			source: 'html',
		},
	},

	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: ( node ) => node.nodeName === 'FIGURE' && !! node.querySelector( 'iframe' ),
				schema: {
					figure: {
						require: [ 'iframe' ],
						children: {
							iframe: {
								attributes: [ 'src', 'allowfullscreen', 'height', 'width' ],
							},
							figcaption: {
								children: getPhrasingContentSchema(),
							},
						},
					},
				},
			},
		],
	},

	edit,

	save( { attributes } ) {
		return <RawHTML>{ attributes.content }</RawHTML>;
	},
};
