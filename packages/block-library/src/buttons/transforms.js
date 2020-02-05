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
			transform: ( props ) =>
				createBlock(
					name,
					{},
					props.map( ( singleProps ) =>
						createBlock( 'core/button', singleProps )
					)
				),
		},
	],
};

export default transforms;
