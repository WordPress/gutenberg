/**
 * WordPress dependencies
 */
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
} from '@wordpress/blocks';

const MAXIMUM_SELECTED_BLOCKS = 6;

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ '*' ],
			__experimentalConvert: ( blocks ) => {
				const columnWidth = +( 100 / blocks.length ).toFixed( 2 );
				const innerBlocksTemplate = blocks.map(
					( { name, attributes, innerBlocks } ) => [
						'core/column',
						{ width: `${ columnWidth }%` },
						[ [ name, { ...attributes }, innerBlocks ] ],
					]
				);
				return createBlock(
					'core/columns',
					{},
					createBlocksFromInnerBlocksTemplate( innerBlocksTemplate )
				);
			},
			isMatch: ( { length: selectedBlocksLength } ) =>
				selectedBlocksLength &&
				selectedBlocksLength <= MAXIMUM_SELECTED_BLOCKS,
		},
	],
};

export default transforms;
