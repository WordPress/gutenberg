import { queryPagination as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

const TEMPLATE = [
	[ 'core/comments-pagination-previous' ],
	[ 'core/comments-pagination-numbers' ],
	[ 'core/comments-pagination-next' ],
];

export const settings = {
	icon,
	template: TEMPLATE,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
