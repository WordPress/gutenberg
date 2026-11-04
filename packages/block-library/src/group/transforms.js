import {
	createBlock,
	cloneSanitizedBlock,
	privateApis as blocksPrivateApis,
} from '@wordpress/blocks';
import { unlock } from '../lock-unlock';

const { isBlockAllowedInParent } = unlock( blocksPrivateApis );

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ '*' ],
			isMatch: ( {}, blocks ) =>
				blocks.every( ( { name } ) =>
					isBlockAllowedInParent( name, 'core/group' )
				),
			__experimentalConvert( blocks ) {
				const alignments = [ 'wide', 'full' ];

				// Determine the widest setting of all the blocks to be grouped
				const widestAlignment = blocks.reduce(
					( accumulator, block ) => {
						const { align } = block.attributes;
						return alignments.indexOf( align ) >
							alignments.indexOf( accumulator )
							? align
							: accumulator;
					},
					undefined
				);

				// Clone the Blocks to be Grouped
				// Failing to create new block references causes the original blocks
				// to be replaced in the switchToBlockType call thereby meaning they
				// are removed both from their original location and within the
				// new group block.
				const groupInnerBlocks = blocks.map( ( block ) =>
					cloneSanitizedBlock( block )
				);

				return createBlock(
					'core/group',
					{
						align: widestAlignment,
						layout: { type: 'constrained' },
					},
					groupInnerBlocks
				);
			},
		},
	],
};

export default transforms;
