/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			convert: ( block ) =>
				createBlock( 'core/verse', block.attributes ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			convert: ( block ) =>
				createBlock( 'core/paragraph', block.attributes ),
		},
	],
};

export default transforms;
