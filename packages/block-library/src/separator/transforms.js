/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'enter',
			regExp: /^-{3,}$/,
			transform: () => createBlock( 'core/separator' ),
		},
		{
			type: 'raw',
			selector: 'hr',
			schema: {
				hr: {},
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/spacer' ], // Transform to Spacer.
			transform: ( { anchor } ) => {
				return createBlock( 'core/spacer', {
					anchor: anchor || '',
				} );
			},
		},
	],
};

export default transforms;
