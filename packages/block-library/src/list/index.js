/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	createBlock,
	getPhrasingContentSchema,
	getBlockAttributes,
} from '@wordpress/blocks';
import { RichText } from '@wordpress/block-editor';
import { replace, join, split, create, toHTMLString, LINE_SEPARATOR } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

const listContentSchema = {
	...getPhrasingContentSchema(),
	ul: {},
	ol: { attributes: [ 'type' ] },
};

// Recursion is needed.
// Possible: ul > li > ul.
// Impossible: ul > ul.
[ 'ul', 'ol' ].forEach( ( tag ) => {
	listContentSchema[ tag ].children = {
		li: {
			children: listContentSchema,
		},
	};
} );

const supports = {
	className: false,
};

const schema = {
	ordered: {
		type: 'boolean',
		default: false,
	},
	values: {
		type: 'string',
		source: 'html',
		selector: 'ol,ul',
		multiline: 'li',
		default: '',
	},
};

export const name = 'core/list';

export const settings = {
	title: __( 'List' ),
	description: __( 'Create a bulleted or numbered list.' ),
	icon,
	category: 'common',
	keywords: [ __( 'bullet list' ), __( 'ordered list' ), __( 'numbered list' ) ],

	attributes: schema,

	supports,

	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ 'core/paragraph' ],
				transform: ( blockAttributes ) => {
					return createBlock( 'core/list', {
						values: toHTMLString( {
							value: join( blockAttributes.map( ( { content } ) => {
								const value = create( { html: content } );

								if ( blockAttributes.length > 1 ) {
									return value;
								}

								// When converting only one block, transform
								// every line to a list item.
								return replace( value, /\n/g, LINE_SEPARATOR );
							} ), LINE_SEPARATOR ),
							multilineTag: 'li',
						} ),
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { value } ) => {
					return createBlock( 'core/list', {
						values: toHTMLString( {
							value: create( { html: value, multilineTag: 'p' } ),
							multilineTag: 'li',
						} ),
					} );
				},
			},
			{
				type: 'raw',
				selector: 'ol,ul',
				schema: {
					ol: listContentSchema.ol,
					ul: listContentSchema.ul,
				},
				transform( node ) {
					return createBlock( 'core/list', {
						...getBlockAttributes(
							'core/list',
							node.outerHTML
						),
						ordered: node.nodeName === 'OL',
					} );
				},
			},
			...[ '*', '-' ].map( ( prefix ) => ( {
				type: 'prefix',
				prefix,
				transform( content ) {
					return createBlock( 'core/list', {
						values: `<li>${ content }</li>`,
					} );
				},
			} ) ),
			...[ '1.', '1)' ].map( ( prefix ) => ( {
				type: 'prefix',
				prefix,
				transform( content ) {
					return createBlock( 'core/list', {
						ordered: true,
						values: `<li>${ content }</li>`,
					} );
				},
			} ) ),
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { values } ) =>
					split( create( {
						html: values,
						multilineTag: 'li',
						multilineWrapperTags: [ 'ul', 'ol' ],
					} ), LINE_SEPARATOR )
						.map( ( piece ) =>
							createBlock( 'core/paragraph', {
								content: toHTMLString( { value: piece } ),
							} )
						),
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { values } ) => {
					return createBlock( 'core/quote', {
						value: toHTMLString( {
							value: create( {
								html: values,
								multilineTag: 'li',
								multilineWrapperTags: [ 'ul', 'ol' ],
							} ),
							multilineTag: 'p',
						} ),
					} );
				},
			},
		],
	},

	deprecated: [
		{
			supports,
			attributes: {
				...omit( schema, [ 'ordered' ] ),
				nodeName: {
					type: 'string',
					source: 'property',
					selector: 'ol,ul',
					property: 'nodeName',
					default: 'UL',
				},
			},
			migrate( attributes ) {
				const { nodeName, ...migratedAttributes } = attributes;

				return {
					...migratedAttributes,
					ordered: 'OL' === nodeName,
				};
			},
			save( { attributes } ) {
				const { nodeName, values } = attributes;

				return (
					<RichText.Content
						tagName={ nodeName.toLowerCase() }
						value={ values }
					/>
				);
			},
		},
	],

	merge( attributes, attributesToMerge ) {
		const { values } = attributesToMerge;

		if ( ! values || values === '<li></li>' ) {
			return attributes;
		}

		return {
			...attributes,
			values: attributes.values + values,
		};
	},

	edit,

	save( { attributes } ) {
		const { ordered, values } = attributes;
		const tagName = ordered ? 'ol' : 'ul';

		return (
			<RichText.Content tagName={ tagName } value={ values } multiline="li" />
		);
	},
};
