/**
 * Internal dependencies
 */
import fixtures from './index.js';

export * from './index';

export default fixtures.map( ( filteredItems ) => ( {
	...filteredItems,
	// Set `isNew` property expected from block type impressions
	isNew: false,
} ) );
