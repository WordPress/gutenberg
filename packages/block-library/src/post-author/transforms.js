/**
 * Internal dependencies
 */
import { migrateToRecommendedBlocks } from './utils';

const transforms = {
	to: [
		{
			type: 'block',
			blocks: [ 'core/group' ],
			transform: ( attributes ) =>
				migrateToRecommendedBlocks( attributes ),
		},
	],
};

export default transforms;
