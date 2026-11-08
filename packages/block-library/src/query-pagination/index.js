import { queryPagination as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

const TEMPLATE = [
	[ 'core/query-pagination-previous' ],
	[ 'core/query-pagination-numbers' ],
	[ 'core/query-pagination-next' ],
];

export const settings = {
	icon,
	template: TEMPLATE,
	edit,
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
