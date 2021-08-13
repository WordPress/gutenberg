/**
 * WordPress dependencies
 */
import { queryPagination as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
};

export { useQueryPaginationContext } from './query-pagination-provider';
export { QueryPaginationArrowControls } from './query-pagination-arrow-controls';
