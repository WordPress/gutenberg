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
					props.map( ( prop ) => createBlock( 'core/button', prop ) )
				),
		},
	],
};

export default transforms;
