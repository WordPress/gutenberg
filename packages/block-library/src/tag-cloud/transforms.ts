import { createBlock } from '@wordpress/blocks';
import type { BlockConfiguration } from '@wordpress/blocks';
import type { TagCloudAttributes } from './types';

const transforms: BlockConfiguration< TagCloudAttributes >[ 'transforms' ] = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/categories' ],
			transform: ( attributes ) => {
				const { taxonomy, showPostCounts } = attributes as {
					taxonomy?: string;
					showPostCounts?: boolean;
				};
				return createBlock( 'core/tag-cloud', {
					taxonomy,
					showTagCounts: showPostCounts,
				} );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/categories' ],
			transform: ( attributes ) => {
				const { taxonomy, showTagCounts } =
					attributes as TagCloudAttributes;
				return createBlock( 'core/categories', {
					taxonomy,
					showPostCounts: showTagCounts,
				} );
			},
		},
	],
};

export default transforms;
