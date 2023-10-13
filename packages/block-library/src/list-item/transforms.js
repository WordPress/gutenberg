/**
 * WordPress dependencies
 */
import { createBlock, cloneBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { convertToListItems } from './utils';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( attributes, innerBlocks = [] ) => [
				createBlock( 'core/paragraph', attributes ),
				...innerBlocks.map( ( block ) => cloneBlock( block ) ),
			],
		},
	],
	from: [
		{
			type: 'paste',
			transform: ( blocks ) => convertToListItems( blocks ),
		},
	],
};

export default transforms;
