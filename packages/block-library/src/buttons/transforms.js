/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { name } from './block.json';

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/button' ],
			transform: ( buttons ) =>
				// Creates the buttons block
				createBlock(
					name,
					{},
					// Loop the selected buttons
					buttons.map( ( attributes ) =>
						// Create singular button in the buttons block
						createBlock( 'core/button', attributes )
					)
				),
		},
	],
};

export default transforms;
