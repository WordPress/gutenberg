/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/separator' ], // Transform to Separator.
			transform: ( { anchor } ) => {
				return createBlock( 'core/separator', {
					anchor: anchor || undefined,
				} );
			},
		},
	],
};

export default transforms;
