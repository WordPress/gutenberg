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
import { HEADING_PLACEHOLDER } from './constants';

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
					// Also include a placeholder for a heading.
					const innerBlocks = [
						createBlock( ...HEADING_PLACEHOLDER ),
						...blocks.map( ( block ) => {
							return createBlock(
								block.name,
								block.attributes,
								block.innerBlocks
							);
						} ),
					];

					return createBlock( 'core/widget-box', {}, innerBlocks );
				},
			},
		],
	},
};
