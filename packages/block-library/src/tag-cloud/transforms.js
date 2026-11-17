import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/categories' ],
			transform: ( { taxonomy, showPostCounts } ) =>
				createBlock( 'core/tag-cloud', {
					taxonomy,
					showTagCounts: showPostCounts,
				} ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/categories' ],
			transform: ( { taxonomy, showTagCounts } ) =>
				createBlock( 'core/categories', {
					taxonomy,
					showPostCounts: showTagCounts,
				} ),
		},
	],
};

export default transforms;
