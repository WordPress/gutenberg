import { createBlock } from '@wordpress/blocks';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/description-term' ],
			transform: ( attributes: Record< string, unknown > ) =>
				createBlock( 'core/description-term', attributes ),
		},
	],
};

export default transforms;
