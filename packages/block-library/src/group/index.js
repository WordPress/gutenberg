/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock, getBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Group' ),
	icon,
	description: __( 'A block that groups other blocks.' ),
	keywords: [ __( 'container' ), __( 'wrapper' ), __( 'row' ), __( 'section' ) ],
	supports: {
		align: [ 'wide', 'full' ],
		anchor: true,
		html: false,
	},

	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ '*' ],
				__experimentalConvert( blocks ) {
					// Avoid transforming a single `core/group` Block
					if ( blocks.length === 1 && blocks[ 0 ].name === 'core/group' ) {
						return;
					}

					// Determine which Blocks have grouping support and which don't
					const { supportedBlocks, unSupportedBlocks } = blocks.reduce( ( acc, block ) => {
						const groupingBlockSupportDefault = true;

						if ( getBlockSupport( block.name, 'grouping', groupingBlockSupportDefault ) ) {
							acc.supportedBlocks.push( block );
						} else {
							acc.unSupportedBlocks.push( block );
						}
						return acc;
					}, {
						supportedBlocks: [],
						unSupportedBlocks: [],
					} );

					// If no blocks support grouping then bale out!
					if ( ! supportedBlocks.length ) {
						return;
					}

					const alignments = [ 'wide', 'full' ];

					// Determine the widest setting of all the blocks to be grouped
					const widestAlignment = supportedBlocks.reduce( ( result, block ) => {
						const { align } = block.attributes;
						return alignments.indexOf( align ) > alignments.indexOf( result ) ? align : result;
					}, undefined );

					// Clone the Blocks to be Grouped
					// Failing to create new block references causes the original blocks
					// to be replaced in the switchToBlockType call thereby meaning they
					// are removed both from their original location and within the
					// new group block.
					const groupInnerBlocks = supportedBlocks.map( ( block ) => {
						return createBlock( block.name, block.attributes, block.innerBlocks );
					} );

					const groupBlock = createBlock( 'core/group', {
						align: widestAlignment,
					}, groupInnerBlocks );

					// Return the blocks that have been Grouped
					// plus any that were unable to be Grouped
					return [ ...unSupportedBlocks, groupBlock ];
				},
			},

		],
	},

	edit,
	save,
	deprecated,
};
