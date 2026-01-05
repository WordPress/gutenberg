/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { createBlock, switchToBlockType } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/verse' ],
			transform: ( { content } ) => {
				return createBlock( 'core/quote', {}, [
					createBlock( 'core/paragraph', { content } ),
				] );
			},
		},
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
				// When a single block is selected make the transformation
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
			blocks: [ 'core/verse' ],
			isMatch: ( {}, block ) => {
				return block.innerBlocks.every( ( innerBlock ) => {
					// Paragraphs are already in the target format
					if ( innerBlock.name === 'core/paragraph' ) {
						return true;
					}
					// Check if other blocks can be converted to paragraphs
					const converted = switchToBlockType(
						innerBlock,
						'core/paragraph'
					);
					return converted !== null;
				} );
			},
			transform: ( {}, innerBlocks ) => {
				const paragraphs = innerBlocks.flatMap( ( innerBlock ) => {
					// If already a paragraph, use it directly
					if ( innerBlock.name === 'core/paragraph' ) {
						return innerBlock;
					}
					// Otherwise convert to paragraph
					return (
						switchToBlockType( innerBlock, 'core/paragraph' ) || []
					);
				} );
				const content = paragraphs
					.map( ( { attributes } ) => attributes.content || '' )
					.filter( Boolean )
					.join( '<br>' );
				return createBlock( 'core/verse', { content } );
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
