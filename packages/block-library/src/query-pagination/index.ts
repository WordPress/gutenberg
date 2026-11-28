import { queryPagination as icon } from '@wordpress/icons';
import type { TemplateItem } from '@wordpress/blocks';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import deprecated from './deprecated';
import type { QueryPaginationAttributes } from './types';

const { name } = metadata;
export { metadata, name };

const TEMPLATE: TemplateItem[] = [
	[ 'core/query-pagination-previous' ],
	[ 'core/query-pagination-numbers' ],
	[ 'core/query-pagination-next' ],
];

export const settings: BlockModule< QueryPaginationAttributes >[ 'settings' ] & {
	template: TemplateItem[];
} = {
	icon,
	template: TEMPLATE,
	edit,
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
