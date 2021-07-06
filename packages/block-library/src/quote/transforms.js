/**
 * WordPress dependencies
 */
import {
	createBlock,
	parseWithAttributeSchema,
	serialize,
	switchToBlockType,
} from '@wordpress/blocks';

const toBlocksOfType = ( blocks, type ) => {
	const result = [];
	blocks.forEach( ( block ) => {
		if ( type === block.name ) {
			result.push( block );
		} else {
			const newBlocks = switchToBlockType( block, type );
			if ( newBlocks ) {
				result.push( ...newBlocks );
			}
		}
	} );
	return result.filter( Boolean );
};

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) => {
				return createBlock(
					'core/quote',
					{},
					attributes.map( ( props ) =>
						createBlock( 'core/paragraph', props )
					)
				);
			},
		},
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/heading' ],
			transform: ( attributes ) => {
				return createBlock(
					'core/quote',
					{},
					attributes.map( ( props ) =>
						createBlock( 'core/heading', props )
					)
				);
			},
		},
		{
			type: 'block',
			blocks: [ 'core/pullquote' ],
			transform: ( { value, citation, anchor } ) => {
				return createBlock(
					'core/quote',
					{
						citation,
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
			transform: () => createBlock( 'core/quote' ),
		},
		{
			type: 'raw',
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
			isMatch: ( node ) => {
				const isAllowedNode = ( () => {
					let hasCitation = false;
					return ( child ) => {
						if (
							[
								'P',
								'H1',
								'H2',
								'H3',
								'H4',
								'H5',
								'H6',
								'UL',
								'OL',
								'PRE',
							].some( ( tag ) => tag === child.nodeName )
						) {
							return true;
						}
						// Child is a cite and no other cite child exists before it.
						if ( ! hasCitation && child.nodeName === 'CITE' ) {
							hasCitation = true;
							return true;
						}
					};
				} )();
				return (
					node.nodeName === 'BLOCKQUOTE' &&
					// The quote block can only handle multiline paragraph
					// content with an optional cite child.
					Array.from( node.childNodes ).every( isAllowedNode )
				);
			},
			transform: ( node ) => {
				const innerBlocks = [];
				let cite = '';
				node.childNodes.forEach( ( childNode ) => {
					switch ( childNode.nodeName ) {
						case 'P':
							innerBlocks.push(
								createBlock( 'core/paragraph', {
									content: childNode.innerHTML,
								} )
							);
							break;
						case 'H1':
							innerBlocks.push(
								createBlock( 'core/heading', {
									level: 1,
									content: childNode.innerHTML,
								} )
							);
							break;
						case 'H2':
							innerBlocks.push(
								createBlock( 'core/heading', {
									level: 2,
									content: childNode.innerHTML,
								} )
							);
							break;
						case 'H3':
							innerBlocks.push(
								createBlock( 'core/heading', {
									level: 3,
									content: childNode.innerHTML,
								} )
							);
							break;
						case 'H4':
							innerBlocks.push(
								createBlock( 'core/heading', {
									level: 4,
									content: childNode.innerHTML,
								} )
							);
							break;
						case 'H5':
							innerBlocks.push(
								createBlock( 'core/heading', {
									level: 5,
									content: childNode.innerHTML,
								} )
							);
							break;
						case 'H6':
							innerBlocks.push(
								createBlock( 'core/heading', {
									level: 6,
									content: childNode.innerHTML,
								} )
							);
							break;
						case 'UL':
							innerBlocks.push(
								createBlock( 'core/list', {
									ordered: false,
									values: childNode.innerHTML,
								} )
							);
							break;
						case 'OL':
							innerBlocks.push(
								createBlock( 'core/list', {
									ordered: true,
									values: childNode.innerHTML,
								} )
							);
							break;
						case 'PRE':
							innerBlocks.push(
								createBlock( 'core/code', {
									content: childNode.innerHTML,
								} )
							);
							break;
						case 'CITE':
							cite = childNode.innerHTML;
							break;
						default:
							break;
					}
				} );
				return createBlock(
					'core/quote',
					{ citation: cite },
					innerBlocks
				);
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( { citation }, innerBlocks ) => {
				const paragraphs = toBlocksOfType(
					innerBlocks,
					'core/paragraph'
				);
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
			transform: ( { citation }, innerBlocks ) => {
				const result = [];
				result.push( ...toBlocksOfType( innerBlocks, 'core/heading' ) );

				if ( citation && citation !== '<p></p>' ) {
					result.push(
						createBlock( 'core/heading', {
							content: citation,
						} )
					);
				}

				return result;
			},
		},

		{
			type: 'block',
			blocks: [ 'core/pullquote' ],
			transform: ( { citation, anchor }, innerBlocks ) => {
				return createBlock( 'core/pullquote', {
					value: serialize(
						toBlocksOfType( innerBlocks, 'core/paragraph' )
					),
					citation,
					anchor,
				} );
			},
		},
	],
};

export default transforms;
