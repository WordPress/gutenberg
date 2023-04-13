/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/archives' ],
			transform: () => createBlock( 'core/calendar' ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/archives' ],
			transform: () => createBlock( 'core/archives' ),
		},
	],
};

export default transforms;
