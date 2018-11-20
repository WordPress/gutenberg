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
import { RichText } from '@wordpress/editor';
import { replace, join, split, create, toHTMLString, LINE_SEPARATOR } from '@wordpress/rich-text';
import { G, Path, SVG } from '@wordpress/components';

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
	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><G><Path d="M9 19h12v-2H9v2zm0-6h12v-2H9v2zm0-8v2h12V5H9zm-4-.5c-.828 0-1.5.672-1.5 1.5S4.172 7.5 5 7.5 6.5 6.828 6.5 6 5.828 4.5 5 4.5zm0 6c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm0 6c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5z" /></G></SVG>,
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
							value: join( blockAttributes.map( ( { content } ) =>
								replace( create( { html: content } ), /\n/g, LINE_SEPARATOR )
							), LINE_SEPARATOR ),
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

	edit( {
		attributes,
		insertBlocksAfter,
		setAttributes,
		mergeBlocks,
		onReplace,
		className,
	} ) {
		const { ordered, values } = attributes;

		return (
			<RichText
				identifier="values"
				multiline="li"
				tagName={ ordered ? 'ol' : 'ul' }
				onChange={ ( nextValues ) => setAttributes( { values: nextValues } ) }
				value={ values }
				wrapperClassName="block-library-list"
				className={ className }
				placeholder={ __( 'Write list…' ) }
				onMerge={ mergeBlocks }
				unstableOnSplit={
					insertBlocksAfter ?
						( before, after, ...blocks ) => {
							if ( ! blocks.length ) {
								blocks.push( createBlock( 'core/paragraph' ) );
							}

							if ( after !== '<li></li>' ) {
								blocks.push( createBlock( 'core/list', {
									ordered,
									values: after,
								} ) );
							}

							setAttributes( { values: before } );
							insertBlocksAfter( blocks );
						} :
						undefined
				}
				onRemove={ () => onReplace( [] ) }
				onTagNameChange={ ( tag ) => setAttributes( { ordered: tag === 'ol' } ) }
			/>
		);
	},

	save( { attributes } ) {
		const { ordered, values } = attributes;
		const tagName = ordered ? 'ol' : 'ul';

		return (
			<RichText.Content tagName={ tagName } value={ values } multiline="li" />
		);
	},
};
