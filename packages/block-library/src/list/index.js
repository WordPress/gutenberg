/**
 * External dependencies
 */
import { compact, get, initial, last, isEmpty, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	createBlock,
	getPhrasingContentSchema,
	getBlockAttributes,
	getBlockType,
} from '@wordpress/blocks';
import {
	RichText,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import splitOnLineBreak from './split-on-line-break';
import edit from './edit';

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
		type: 'array',
		source: 'children',
		selector: 'ol,ul',
		default: [],
	},
	textColor: {
		type: 'string',
	},
	backgroundColor: {
		type: 'string',
	},
};

export const name = 'core/list';

export const settings = {
	title: __( 'List' ),
	description: __( 'Numbers, bullets, up to you. Add a list of items.' ),
	icon: <svg role="img" aria-hidden="true" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g><path d="M9 19h12v-2H9v2zm0-6h12v-2H9v2zm0-8v2h12V5H9zm-4-.5c-.828 0-1.5.672-1.5 1.5S4.172 7.5 5 7.5 6.5 6.828 6.5 6 5.828 4.5 5 4.5zm0 6c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm0 6c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5z" /></g></svg>,
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
					let items = blockAttributes.map( ( { content } ) => content );
					const hasItems = ! items.every( isEmpty );

					// Look for line breaks if converting a single paragraph,
					// then treat each line as a list item.
					if ( hasItems && items.length === 1 ) {
						items = splitOnLineBreak( items[ 0 ] );
					}

					return createBlock( 'core/list', {
						values: hasItems ? items.map( ( content, index ) => <li key={ index }>{ content }</li> ) : [],
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { value, citation } ) => {
					const items = value.map( ( p ) => get( p, [ 'children', 'props', 'children' ] ) );
					if ( ! isEmpty( citation ) ) {
						items.push( citation );
					}
					const hasItems = ! items.every( isEmpty );
					return createBlock( 'core/list', {
						values: hasItems ? items.map( ( content, index ) => <li key={ index }>{ content }</li> ) : [],
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
							getBlockType( 'core/list' ),
							node.outerHTML
						),
						ordered: node.nodeName === 'OL',
					} );
				},
			},
			{
				type: 'pattern',
				regExp: /^[*-]\s/,
				transform: ( { content } ) => {
					return createBlock( 'core/list', {
						values: [ <li key="1">{ content }</li> ],
					} );
				},
			},
			{
				type: 'pattern',
				regExp: /^1[.)]\s/,
				transform: ( { content } ) => {
					return createBlock( 'core/list', {
						ordered: true,
						values: [ <li key="1">{ content }</li> ],
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { values } ) =>
					compact( values.map( ( value ) => get( value, [ 'props', 'children' ], null ) ) )
						.map( ( content ) => createBlock( 'core/paragraph', {
							content: [ content ],
						} ) ),
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { values } ) => {
					return createBlock( 'core/quote', {
						value: compact( ( values.length === 1 ? values : initial( values ) )
							.map( ( value ) => get( value, [ 'props', 'children' ], null ) ) )
							.map( ( children ) => ( { children: <p>{ children }</p> } ) ),
						citation: ( values.length === 1 ? undefined : [ get( last( values ), [ 'props', 'children' ] ) ] ),
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
		const valuesToMerge = attributesToMerge.values || [];

		// Standard text-like block attribute.
		if ( attributesToMerge.content ) {
			valuesToMerge.push( attributesToMerge.content );
		}

		return {
			...attributes,
			values: [
				...attributes.values,
				...valuesToMerge,
			],
		};
	},

	edit,

	save( { attributes } ) {
		const { ordered, values } = attributes;
		const tagName = ordered ? 'ol' : 'ul';

		return (
			<RichText.Content tagName={ tagName } value={ values } />
		);
	},
};
