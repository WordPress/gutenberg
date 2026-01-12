import { queryPaginationNumbers as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import Edit from './edit';
import metadata from './block.json';

const { name } = metadata;
export { metadata, name };

export const settings = {
	edit: Edit,
	icon,
};

export const init = () => initBlock( { name, metadata, settings } );
