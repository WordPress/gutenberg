import { queryPagination as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import TermsQueryPaginationEdit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	edit: TermsQueryPaginationEdit,
	save,
	icon,
};

export const init = () => initBlock( { name, metadata, settings } );
