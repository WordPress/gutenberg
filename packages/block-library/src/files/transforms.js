import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/file' ],
			transform: ( attributesList ) =>
				createBlock(
					'core/files',
					{},
					attributesList.map( ( attributes ) =>
						createBlock( 'core/file', attributes )
					)
				),
		},
	],
	ungroup: ( attributes, innerBlocks ) => innerBlocks,
};

export default transforms;
