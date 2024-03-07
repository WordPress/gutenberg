/**
 * WordPress dependencies
 */
import { queryPaginationNext as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	lazyEdit: () =>
		import(
			/* webpackChunkName: "comments-pagination-next/editor" */ './edit'
		),
};

export const init = () => initBlock( { name, metadata, settings } );
