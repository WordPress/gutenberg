/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { concatChildren } from '@wordpress/element';
import { createBlock, getPhrasingContentSchema } from '@wordpress/blocks';
import { RichText } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/heading';

export const settings = {
	title: __( 'Heading' ),

	description: __( 'Insert a headline above your post or page content.' ),

	icon: 'heading',

	category: 'common',

	keywords: [ __( 'title' ), __( 'subtitle' ) ],

	supports: {
		className: false,
		anchor: true,
	},

	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'h1,h2,h3,h4,h5,h6',
		},
		nodeName: {
			type: 'string',
			source: 'property',
			selector: 'h1,h2,h3,h4,h5,h6',
			property: 'nodeName',
			default: 'H2',
		},
		align: {
			type: 'string',
		},
		placeholder: {
			type: 'string',
		},
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'core/heading', {
						content,
					} );
				},
			},
			{
				type: 'raw',
				selector: 'h1,h2,h3,h4,h5,h6',
				schema: {
					h1: { children: getPhrasingContentSchema() },
					h2: { children: getPhrasingContentSchema() },
					h3: { children: getPhrasingContentSchema() },
					h4: { children: getPhrasingContentSchema() },
					h5: { children: getPhrasingContentSchema() },
					h6: { children: getPhrasingContentSchema() },
				},
			},
			{
				type: 'pattern',
				regExp: /^(#{2,6})\s/,
				transform: ( { content, match } ) => {
					const level = match[ 1 ].length;

					return createBlock( 'core/heading', {
						nodeName: `H${ level }`,
						content,
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'core/paragraph', {
						content,
					} );
				},
			},
		],
	},

	merge( attributes, attributesToMerge ) {
		return {
			content: concatChildren( attributes.content, attributesToMerge.content ),
		};
	},

	edit,

	save( { attributes } ) {
		const { align, nodeName, content } = attributes;

		return (
			<RichText.Content
				tagName={ nodeName.toLowerCase() }
				style={ { textAlign: align } }
				value={ content }
			/>
		);
	},
};
