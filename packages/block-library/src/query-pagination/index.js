/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';
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
	title: _x( 'Query Pagination', 'block title' ),
	description: __(
		'Displays a paginated navigation to next/previous set of posts, when applicable.'
	),
	icon,
	edit,
	save,
	parent: [ 'core/query' ],
};
