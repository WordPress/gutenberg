/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/pullquote' ],
			transform: ( {
				value,
				align,
				citation,
				anchor,
				fontSize,
				style,
			} ) => {
				return createBlock(
					'core/quote',
					{
						align,
						citation,
						anchor,
						fontSize,
						style,
					},
					[ createBlock( 'core/paragraph', { content: value } ) ]
				);
			},
		},
		{
			type: 'prefix',
			prefix: '>',
			transform: ( content ) =>
				createBlock( 'core/quote', {}, [
					createBlock( 'core/paragraph', { content } ),
				] ),
		},
		{
			type: 'raw',
			schema: () => ( {
				blockquote: {
					children: '*',
				},
			} ),
			selector: 'blockquote',
			transform: ( node, handler ) => {
				return createBlock(
					'core/quote',
					// Don't try to parse any `cite` out of this content.
					// * There may be more than one cite.
					// * There may be more attribution text than just the cite.
					// * If the cite is nested in the quoted text, it's wrong to
					//   remove it.
					{},
					handler( {
						HTML: node.innerHTML,
						mode: 'BLOCKS',
					} )
				);
			},
		},
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ '*' ],
			isMatch: ( {}, blocks ) => {
				// When a single block is selected make the tranformation
				// available only to specific blocks that make sense.
				if ( blocks.length === 1 ) {
					return [
						'core/paragraph',
						'core/heading',
						'core/list',
						'core/pullquote',
					].includes( blocks[ 0 ].name );
				}
				return ! blocks.some( ( { name } ) => name === 'core/quote' );
			},
			__experimentalConvert: ( blocks ) =>
				createBlock(
					'core/quote',
					{},
					blocks.map( ( block ) =>
						createBlock(
							block.name,
							block.attributes,
							block.innerBlocks
						)
					)
				),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/pullquote' ],
			isMatch: ( {}, block ) => {
				return block.innerBlocks.every(
					( { name } ) => name === 'core/paragraph'
				);
			},
			transform: (
				{ align, citation, anchor, fontSize, style },
				innerBlocks
			) => {
				const value = innerBlocks
					.map( ( { attributes } ) => `${ attributes.content }` )
					.join( '<br>' );
				return createBlock( 'core/pullquote', {
					value,
					align,
					citation,
					anchor,
					fontSize,
					style,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( { citation }, innerBlocks ) =>
				RichText.isEmpty( citation )
					? innerBlocks
					: [
							...innerBlocks,
							createBlock( 'core/paragraph', {
								content: citation,
							} ),
					  ],
		},
		{
			type: 'block',
			blocks: [ 'core/group' ],
			transform: ( { citation, anchor }, innerBlocks ) =>
				createBlock(
					'core/group',
					{ anchor },
					RichText.isEmpty( citation )
						? innerBlocks
						: [
								...innerBlocks,
								createBlock( 'core/paragraph', {
									content: citation,
								} ),
						  ]
				),
		},
	],
	ungroup: ( { citation }, innerBlocks ) =>
		RichText.isEmpty( citation )
			? innerBlocks
			: [
					...innerBlocks,
					createBlock( 'core/paragraph', {
						content: citation,
					} ),
			  ],
};

export default transforms;
