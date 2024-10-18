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
			blocks: [ 'core/spacer' ],
			transform: () => {
				return createBlock( 'core/spacer', {
					height: '50px',
				} );
			},
		},
	],
};

export default transforms;
