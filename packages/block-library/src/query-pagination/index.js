/**
 * WordPress dependencies
 */
import { queryPagination as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';

import save from './save';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	lazyEdit: () =>
		import( /* webpackChunkName: "query-pagination/editor" */ './edit' ),
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
