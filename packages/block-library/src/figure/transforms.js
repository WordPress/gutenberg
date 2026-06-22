/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'raw',
			selector: 'figure',
			transform( node ) {
				const figcaption = node.querySelector( 'figcaption' );
				const captionText = figcaption ? figcaption.innerHTML : '';

				if ( figcaption ) {
					figcaption.parentNode.removeChild( figcaption );
				}

				return createBlock( 'core/figure', { caption: captionText } );
			},
		},

		{
			type: 'block',
			blocks: [ 'core/group' ],
			transform( attributes, innerBlocks ) {
				const {
					backgroundColor,
					textColor,
					borderColor,
					style,
					align,
				} = attributes;
				return createBlock(
					'core/figure',
					{ backgroundColor, textColor, borderColor, style, align },
					innerBlocks
				);
			},
		},

		{
			type: 'block',
			blocks: [ 'core/code' ],
			transform( attributes ) {
				return createBlock( 'core/figure', {}, [
					createBlock( 'core/code', attributes ),
				] );
			},
		},

		{
			type: 'block',
			blocks: [ 'core/quote' ],
			transform( attributes, innerBlocks ) {
				return createBlock(
					'core/figure',
					{ caption: attributes.citation || '' },
					[
						createBlock(
							'core/quote',
							{
								...attributes,
								citation: '',
							},
							innerBlocks
						),
					]
				);
			},
		},

		{
			type: 'block',
			blocks: [ '*' ],
			isMultiBlock: true,
			isMatch: ( attributes, blocks ) => {
				if (
					blocks.length === 1 &&
					blocks[ 0 ].name === 'core/figure'
				) {
					return false;
				}
				return true;
			},
			__experimentalConvert( blocks ) {
				const clonedInnerBlocks = blocks.map( ( block ) =>
					createBlock(
						block.name,
						block.attributes,
						block.innerBlocks
					)
				);
				return createBlock( 'core/figure', {}, clonedInnerBlocks );
			},
		},
	],

	to: [
		{
			type: 'block',
			blocks: [ 'core/group' ],
			transform(
				{ backgroundColor, textColor, borderColor, style, align },
				innerBlocks
			) {
				return createBlock(
					'core/group',
					{ backgroundColor, textColor, borderColor, style, align },
					innerBlocks
				);
			},
		},

		{
			type: 'block',
			blocks: [ 'core/quote' ],
			transform( attributes, innerBlocks ) {
				if (
					innerBlocks.length === 1 &&
					innerBlocks[ 0 ].name === 'core/quote'
				) {
					return createBlock(
						'core/quote',
						{
							...innerBlocks[ 0 ].attributes,
							citation:
								attributes.caption ||
								innerBlocks[ 0 ].attributes.citation,
						},
						innerBlocks[ 0 ].innerBlocks
					);
				}

				return createBlock(
					'core/quote',
					{ citation: attributes.caption },
					innerBlocks
				);
			},
		},

		{
			type: 'block',
			blocks: [ 'core/code' ],
			transform( attributes, innerBlocks ) {
				if (
					innerBlocks.length === 1 &&
					innerBlocks[ 0 ].name === 'core/code'
				) {
					return createBlock(
						'core/code',
						innerBlocks[ 0 ].attributes
					);
				}

				return createBlock( 'core/code', { content: '' } );
			},
		},
	],
};

export default transforms;
