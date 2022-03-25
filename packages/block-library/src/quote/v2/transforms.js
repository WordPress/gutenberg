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
			transform: ( { value, citation, anchor } ) => {
				return createBlock(
					'core/quote',
					{
						attribution: citation,
						anchor,
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
				const cite = node.querySelector( 'cite' );
				const attribution =
					cite?.innerHTML ??
					node.querySelector( 'figcaption' )?.innerHTML;
				cite?.parentNode?.removeChild( cite );
				return createBlock(
					'core/quote',
					{
						attribution,
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
			isMatch: ( attributes, blocks ) => {
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
		{
			type: 'block',
			blocks: [ 'core/group' ],
			transform: ( {}, innerBlocks ) =>
				createBlock( 'core/quote', {}, innerBlocks ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/pullquote' ],
			isMatch: ( attributes, block ) => {
				return block.innerBlocks.every(
					( { name } ) => name === 'core/paragraph'
				);
			},
			transform: ( { attribution, anchor }, innerBlocks ) => {
				return createBlock( 'core/pullquote', {
					value: serialize( innerBlocks ),
					citation: attribution,
					anchor,
				} );
			},
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
		{
			type: 'block',
			blocks: [ 'core/group' ],
			transform: ( { attribution }, innerBlocks ) =>
				createBlock(
					'core/group',
					{},
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
	],
};

export default transforms;
