import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/description-detail' ],
			transform: ( attributes ) =>
				createBlock( 'core/description-detail', attributes ),
		},
	],
};

export default transforms;
