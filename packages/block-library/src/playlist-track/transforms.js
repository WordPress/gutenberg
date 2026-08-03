/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/audio' ],
			transform: ( { blob, id, src } ) =>
				createBlock( 'core/audio', {
					blob,
					src,
					...( id !== undefined && { id } ),
				} ),
		},
	],
};

export default transforms;
