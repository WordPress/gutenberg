/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { group as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Widget Group' ),
	description: __(
		'Create a classic widget layout with a title that’s styled by your theme for your widget areas.'
	),
	icon,
	__experimentalLabel: ( { name: label } ) => label,
	edit,
	save,
	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ '*' ],
				isMatch( attributes, blocks ) {
					// Avoid transforming existing `widget-group` blocks.
					return ! blocks.some(
						( block ) => block.name === 'core/widget-group'
					);
				},
				__experimentalConvert( blocks ) {
					// Put the selected blocks inside the new Widget Group's innerBlocks.
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
					// it's content into the Widget Group's title attribute.
					innerBlocks = innerBlocks.filter(
						( block ) => block !== firstHeadingBlock
					);

					return createBlock(
						'core/widget-group',
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
	deprecated,
};
