/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Query Pagination' ),
	parent: [ 'core/query' ],
	supports: {
		inserter: false,
		reusable: false,
		html: false,
	},
	edit,
};
