/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { createBlock, getPhrasingContentSchema } from '@wordpress/blocks';
import { RichText } from '@wordpress/block-editor';
import { join, split, create, toHTMLString } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import { ATTRIBUTE_QUOTE, ATTRIBUTE_CITATION } from './contants';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

const blockAttributes = {
	[ ATTRIBUTE_QUOTE ]: {
		type: 'string',
		source: 'html',
		selector: 'blockquote',
		multiline: 'p',
		default: '',
	},
	[ ATTRIBUTE_CITATION ]: {
		type: 'string',
		source: 'html',
		selector: 'cite',
		default: '',
	},
	align: {
		type: 'string',
	},
};

export const settings = {
	title: __( 'Quote' ),
	description: __( 'Give quoted text visual emphasis. "In quoting others, we cite ourselves." — Julio Cortázar' ),
	icon,
	keywords: [ __( 'blockquote' ) ],

	attributes: blockAttributes,

	styles: [
		{ name: 'default', label: _x( 'Default', 'block style' ), isDefault: true },
		{ name: 'large', label: _x( 'Large', 'block style' ) },
	],

	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ 'core/paragraph' ],
				transform: ( attributes ) => {
					return createBlock( 'core/quote', {
						value: toHTMLString( {
							value: join( attributes.map( ( { content } ) =>
								create( { html: content } )
							), '\u2028' ),
							multilineTag: 'p',
						} ),
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { content } ) => {
					return createBlock( 'core/quote', {
						value: `<p>${ content }</p>`,
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/pullquote' ],
				transform: ( { value, citation } ) => createBlock( 'core/quote', {
					value,
					citation,
				} ),
			},
			{
				type: 'prefix',
				prefix: '>',
				transform: ( content ) => {
					return createBlock( 'core/quote', {
						value: `<p>${ content }</p>`,
					} );
				},
			},
			{
				type: 'raw',
				isMatch: ( node ) => {
					const isParagraphOrSingleCite = ( () => {
						let hasCitation = false;
						return ( child ) => {
							// Child is a paragraph.
							if ( child.nodeName === 'P' ) {
								return true;
							}
							// Child is a cite and no other cite child exists before it.
							if (
								! hasCitation &&
								child.nodeName === 'CITE'
							) {
								hasCitation = true;
								return true;
							}
						};
					} )();
					return node.nodeName === 'BLOCKQUOTE' &&
					// The quote block can only handle multiline paragraph
					// content with an optional cite child.
					Array.from( node.childNodes ).every(
						isParagraphOrSingleCite
					);
				},
				schema: {
					blockquote: {
						children: {
							p: {
								children: getPhrasingContentSchema(),
							},
							cite: {
								children: getPhrasingContentSchema(),
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
				transform: ( { value, citation } ) => {
					const paragraphs = [];
					if ( value && value !== '<p></p>' ) {
						paragraphs.push(
							...split( create( { html: value, multilineTag: 'p' } ), '\u2028' )
								.map( ( piece ) =>
									createBlock( 'core/paragraph', {
										content: toHTMLString( { value: piece } ),
									} )
								)
						);
					}
					if ( citation && citation !== '<p></p>' ) {
						paragraphs.push(
							createBlock( 'core/paragraph', {
								content: citation,
							} )
						);
					}

					if ( paragraphs.length === 0 ) {
						return createBlock( 'core/paragraph', {
							content: '',
						} );
					}
					return paragraphs;
				},
			},

			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { value, citation, ...attrs } ) => {
					// If there is no quote content, use the citation as the
					// content of the resulting heading. A nonexistent citation
					// will result in an empty heading.
					if ( value === '<p></p>' ) {
						return createBlock( 'core/heading', {
							content: citation,
						} );
					}

					const pieces = split( create( { html: value, multilineTag: 'p' } ), '\u2028' );

					const headingBlock = createBlock( 'core/heading', {
						content: toHTMLString( { value: pieces[ 0 ] } ),
					} );

					if ( ! citation && pieces.length === 1 ) {
						return headingBlock;
					}

					const quotePieces = pieces.slice( 1 );

					const quoteBlock = createBlock( 'core/quote', {
						...attrs,
						citation,
						value: toHTMLString( {
							value: quotePieces.length ? join( pieces.slice( 1 ), '\u2028' ) : create(),
							multilineTag: 'p',
						} ),
					} );

					return [ headingBlock, quoteBlock ];
				},
			},

			{
				type: 'block',
				blocks: [ 'core/pullquote' ],
				transform: ( { value, citation } ) => {
					return createBlock( 'core/pullquote', {
						value,
						citation,
					} );
				},
			},
		],
	},

	edit,

	save( { attributes } ) {
		const { align, value, citation } = attributes;

		return (
			<blockquote style={ { textAlign: align ? align : null } }>
				<RichText.Content multiline value={ value } />
				{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
			</blockquote>
		);
	},

	merge( attributes, { value, citation } ) {
		if ( ! value || value === '<p></p>' ) {
			return {
				...attributes,
				citation: attributes.citation + citation,
			};
		}

		return {
			...attributes,
			value: attributes.value + value,
			citation: attributes.citation + citation,
		};
	},

	deprecated: [
		{
			attributes: {
				...blockAttributes,
				style: {
					type: 'number',
					default: 1,
				},
			},

			migrate( attributes ) {
				if ( attributes.style === 2 ) {
					return {
						...omit( attributes, [ 'style' ] ),
						className: attributes.className ? attributes.className + ' is-style-large' : 'is-style-large',
					};
				}

				return attributes;
			},

			save( { attributes } ) {
				const { align, value, citation, style } = attributes;

				return (
					<blockquote
						className={ style === 2 ? 'is-large' : '' }
						style={ { textAlign: align ? align : null } }
					>
						<RichText.Content multiline value={ value } />
						{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="cite" value={ citation } /> }
					</blockquote>
				);
			},
		},
		{
			attributes: {
				...blockAttributes,
				citation: {
					type: 'string',
					source: 'html',
					selector: 'footer',
					default: '',
				},
				style: {
					type: 'number',
					default: 1,
				},
			},

			save( { attributes } ) {
				const { align, value, citation, style } = attributes;

				return (
					<blockquote
						className={ `blocks-quote-style-${ style }` }
						style={ { textAlign: align ? align : null } }
					>
						<RichText.Content multiline value={ value } />
						{ ! RichText.isEmpty( citation ) && <RichText.Content tagName="footer" value={ citation } /> }
					</blockquote>
				);
			},
		},
	],
};
