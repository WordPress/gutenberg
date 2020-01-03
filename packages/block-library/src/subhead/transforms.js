/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
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
