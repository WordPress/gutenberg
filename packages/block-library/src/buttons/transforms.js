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
			blocks: [ 'core/button' ],
			transform: ( props ) =>
				createBlock( name, { attributes: props }, [
					createBlock( 'core/button', props ),
				] ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ name ],
			transform: ( { content } ) => createBlock( name, { content } ),
		},
	],
};

export default transforms;
