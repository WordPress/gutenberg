/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { create, join, split, toHTMLString } from '@wordpress/rich-text';

const transforms = {
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
			schema: ( { phrasingContentSchema } ) => ( {
				blockquote: {
					children: {
						p: {
							children: phrasingContentSchema,
						},
						cite: {
							children: phrasingContentSchema,
						},
					},
				},
			} ),
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
};

export default transforms;
