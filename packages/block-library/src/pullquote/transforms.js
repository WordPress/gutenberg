/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { create, join, toHTMLString } from '@wordpress/rich-text';

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
							'\n'
						),
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
					value: content,
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
				if ( value ) {
					paragraphs.push(
						createBlock( 'core/paragraph', {
							content: value,
						} )
					);
				}
				if ( citation ) {
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
			transform: ( { value, citation } ) => {
				// If there is no pullquote content, use the citation as the
				// content of the resulting heading. A nonexistent citation
				// will result in an empty heading.
				if ( ! value ) {
					return createBlock( 'core/heading', {
						content: citation,
					} );
				}
				const headingBlock = createBlock( 'core/heading', {
					content: value,
				} );
				if ( ! citation ) {
					return headingBlock;
				}
				return [
					headingBlock,
					createBlock( 'core/heading', {
						content: citation,
					} ),
				];
			},
		},
	],
};

export default transforms;
