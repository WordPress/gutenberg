/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';
import { queryPaginationNumbers as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Query Pagination Numbers', 'block title' ),
	description: __( 'Displays a list of page numbers for pagination' ),
	icon,
	edit,
	parent: [ 'core/query-pagination' ],
};
