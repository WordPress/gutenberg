/**
 * WordPress dependencies
 */
import {
	createBlock,
	parseWithAttributeSchema,
	rawHandler,
	serialize,
} from '@wordpress/blocks';

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
					parseWithAttributeSchema( value, {
						type: 'array',
						source: 'query',
						selector: 'p',
						query: {
							content: {
								type: 'string',
								source: 'html',
							},
						},
					} ).map( ( { content } ) =>
						createBlock( 'core/paragraph', { content } )
					)
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
			transform: ( node ) => {
				return createBlock(
					'core/quote',
					// Don't try to parse any `cite` out of this content.
					// * There may be more than one cite.
					// * There may be more attribution text than just the cite.
					// * If the cite is nested in the quoted text, it's wrong to
					//   remove it.
					{},
					rawHandler( {
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
				return createBlock( 'core/pullquote', {
					value: serialize( innerBlocks ),
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
