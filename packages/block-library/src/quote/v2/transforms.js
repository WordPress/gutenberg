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
						attribution: citation,
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
								source: 'text',
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
			schema: ( { phrasingContentSchema } ) => ( {
				figure: {
					require: [ 'blockquote' ],
					children: {
						blockquote: {
							children: '*',
						},
						figcaption: {
							children: phrasingContentSchema,
						},
					},
				},
			} ),
			isMatch: ( node ) =>
				node.nodeName === 'FIGURE' &&
				!! node.querySelector( 'blockquote' ),
			transform: ( node ) => {
				return createBlock(
					'core/quote',
					{
						attribution: node.querySelector( 'figcaption' )
							?.innerHTML,
					},
					rawHandler( {
						HTML: node.querySelector( 'blockquote' ).innerHTML,
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
				{ attribution, anchor, fontSize, style },
				innerBlocks
			) => {
				return createBlock( 'core/pullquote', {
					value: serialize( innerBlocks ),
					citation: attribution,
					anchor,
					fontSize,
					style,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/group' ],
			transform: ( { attribution, anchor }, innerBlocks ) =>
				createBlock(
					'core/group',
					{ anchor },
					attribution
						? [
								...innerBlocks,
								createBlock( 'core/paragraph', {
									content: attribution,
								} ),
						  ]
						: innerBlocks
				),
		},
		{
			type: 'block',
			blocks: [ '*' ],
			transform: ( { attribution }, innerBlocks ) =>
				attribution
					? [
							...innerBlocks,
							createBlock( 'core/paragraph', {
								content: attribution,
							} ),
					  ]
					: innerBlocks,
		},
	],
};

export default transforms;
