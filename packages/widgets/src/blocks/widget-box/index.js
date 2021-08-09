/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';
const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Widget Box' ),
	description: __( 'A widget container.' ),
	__experimentalLabel: ( { name: label } ) => label,
	edit,
	save,
	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ '*' ],
				__experimentalConvert( blocks ) {
					// Avoid transforming existing `widget-box` blocks.
					const blocksContainWidgetBox = !! blocks.filter(
						( block ) => block.name === 'core/widget-box'
					)?.length;

					if ( blocksContainWidgetBox ) {
						return;
					}

					// Put the selected blocks inside the new Widget Box's innerBlocks.
					let innerBlocks = [
						...blocks.map( ( block ) => {
							return createBlock(
								block.name,
								block.attributes,
								block.innerBlocks
							);
						} ),
					];

					// If the first block is a heading then assume this is intended
					// to be the Widget's "title".
					const firstHeadingBlock =
						innerBlocks[ 0 ].name === 'core/heading'
							? innerBlocks[ 0 ]
							: null;

					// Remove the first heading block as we're copying
					// it's content into the Widget Box's title attribute.
					innerBlocks = innerBlocks.filter(
						( block ) => block !== firstHeadingBlock
					);

					return createBlock(
						'core/widget-box',
						{
							...( firstHeadingBlock && {
								title: firstHeadingBlock.attributes.content,
							} ),
						},
						innerBlocks
					);
				},
			},
		],
	},
};
