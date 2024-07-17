/**
 * WordPress dependencies
 */
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'input',
			regExp: /^-{3,}$/,
			transform: () => [
				createBlock( 'core/separator' ),
				createBlock( getDefaultBlockName() ),
			],
		},
		{
			type: 'raw',
			selector: 'hr',
			schema: {
				hr: {},
			},
		},
	],
};

export default transforms;
