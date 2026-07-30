/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/audio' ],
			transform: ( { blob, caption, id, src } ) =>
				createBlock( 'core/playlist', { caption }, [
					createBlock( 'core/playlist-track', {
						blob,
						id,
						src,
					} ),
				] ),
		},
	],
};

export default transforms;
