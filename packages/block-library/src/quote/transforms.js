/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/pullquote' ],
			transform: ( { value, citation, anchor, fontSize, style } ) => {
				return createBlock(
					'core/quote',
					{
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
			type: 'block',
			blocks: [ 'core/group' ],
			transform: ( { anchor }, innerBlocks ) =>
				createBlock( 'core/quote', { anchor }, innerBlocks ),
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
				{ citation, anchor, fontSize, style },
				innerBlocks
			) => {
				const value = innerBlocks
					.map( ( { attributes } ) => `${ attributes.content }` )
					.join( '<br>' );
				return createBlock( 'core/pullquote', {
					value,
					citation,
					anchor,
					fontSize,
					style,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/group' ],
			transform: ( { citation, anchor }, innerBlocks ) =>
				createBlock(
					'core/group',
					{ anchor },
					citation
						? [
								...innerBlocks,
								createBlock( 'core/paragraph', {
									content: citation,
								} ),
						  ]
						: innerBlocks
				),
		},
		{
			type: 'block',
			blocks: [ '*' ],
			transform: ( { citation }, innerBlocks ) =>
				citation
					? [
							...innerBlocks,
							createBlock( 'core/paragraph', {
								content: citation,
							} ),
					  ]
					: innerBlocks,
		},
	],
};

export default transforms;
