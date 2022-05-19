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
				return createBlock( 'core/pullquote', {
					value: toHTMLString( {
						value: join(
							attributes.map( ( { content } ) =>
								create( { html: content } )
							),
							'\u2028'
						),
						multilineTag: 'p',
					} ),
					anchor: attributes.anchor,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/heading' ],
			transform: ( { content, anchor } ) => {
				return createBlock( 'core/pullquote', {
					value: `<p>${ content }</p>`,
					anchor,
				} );
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
						...split(
							create( { html: value, multilineTag: 'p' } ),
							'\u2028'
						).map( ( piece ) =>
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
				// If there is no pullquote content, use the citation as the
				// content of the resulting heading. A nonexistent citation
				// will result in an empty heading.
				if ( value === '<p></p>' ) {
					return createBlock( 'core/heading', {
						content: citation,
					} );
				}
				const pieces = split(
					create( { html: value, multilineTag: 'p' } ),
					'\u2028'
				);
				const headingBlock = createBlock( 'core/heading', {
					content: toHTMLString( { value: pieces[ 0 ] } ),
				} );
				if ( ! citation && pieces.length === 1 ) {
					return headingBlock;
				}
				const quotePieces = pieces.slice( 1 );
				const pullquoteBlock = createBlock( 'core/pullquote', {
					...attrs,
					citation,
					value: toHTMLString( {
						value: quotePieces.length
							? join( pieces.slice( 1 ), '\u2028' )
							: create(),
						multilineTag: 'p',
					} ),
				} );
				return [ headingBlock, pullquoteBlock ];
			},
		},
	],
};

export default transforms;
