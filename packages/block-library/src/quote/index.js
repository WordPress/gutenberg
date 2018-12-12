/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { createBlock, getPhrasingContentSchema } from '@wordpress/blocks';
import {
	BlockControls,
	AlignmentToolbar,
	RichText,
} from '@wordpress/editor';
import { join, split, create, toHTMLString } from '@wordpress/rich-text';
import { G, Path, SVG } from '@wordpress/components';

const ATTRIBUTE_QUOTE = 'value';
const ATTRIBUTE_CITATION = 'citation';

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

export const name = 'core/quote';

export const settings = {
	title: __( 'Quote' ),
	description: __( 'Give quoted text visual emphasis. "In quoting others, we cite ourselves." — Julio Cortázar' ),
	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path fill="none" d="M0 0h24v24H0V0z" /><G><Path d="M19 18h-6l2-4h-2V6h8v7l-2 5zm-2-2l2-3V8h-4v4h4l-2 4zm-8 2H3l2-4H3V6h8v7l-2 5zm-2-2l2-3V8H5v4h4l-2 4z" /></G></SVG>,
	category: 'common',
	keywords: [ __( 'blockquote' ) ],

	attributes: blockAttributes,

	styles: [
		{ name: 'default', label: _x( 'Regular', 'block style' ), isDefault: true },
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
					const quotePieces = pieces.slice( 1 );

					return [
						createBlock( 'core/heading', {
							content: toHTMLString( { value: pieces[ 0 ] } ),
						} ),
						createBlock( 'core/quote', {
							...attrs,
							citation,
							value: toHTMLString( {
								value: quotePieces.length ? join( pieces.slice( 1 ), '\u2028' ) : create(),
								multilineTag: 'p',
							} ),
						} ),
					];
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

	edit( { attributes, setAttributes, isSelected, mergeBlocks, onReplace, className } ) {
		const { align, value, citation } = attributes;
		return (
			<Fragment>
				<BlockControls>
					<AlignmentToolbar
						value={ align }
						onChange={ ( nextAlign ) => {
							setAttributes( { align: nextAlign } );
						} }
					/>
				</BlockControls>
				<blockquote className={ className } style={ { textAlign: align } }>
					<RichText
						identifier={ ATTRIBUTE_QUOTE }
						multiline
						value={ value }
						onChange={
							( nextValue ) => setAttributes( {
								value: nextValue,
							} )
						}
						onMerge={ mergeBlocks }
						onRemove={ ( forward ) => {
							const hasEmptyCitation = ! citation || citation.length === 0;
							if ( ! forward && hasEmptyCitation ) {
								onReplace( [] );
							}
						} }
						placeholder={
							// translators: placeholder text used for the quote
							__( 'Write quote…' )
						}
					/>
					{ ( ! RichText.isEmpty( citation ) || isSelected ) && (
						<RichText
							identifier={ ATTRIBUTE_CITATION }
							value={ citation }
							onChange={
								( nextCitation ) => setAttributes( {
									citation: nextCitation,
								} )
							}
							placeholder={
								// translators: placeholder text used for the citation
								__( 'Write citation…' )
							}
							className="wp-block-quote__citation"
						/>
					) }
				</blockquote>
			</Fragment>
		);
	},

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
