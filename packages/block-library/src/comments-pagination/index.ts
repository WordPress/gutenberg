import { queryPagination as icon } from '@wordpress/icons';
import type { TemplateItem } from '@wordpress/blocks';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import type { CommentsPaginationAttributes } from './types';

const { name } = metadata;
export { metadata, name };

const TEMPLATE: TemplateItem[] = [
	[ 'core/comments-pagination-previous' ],
	[ 'core/comments-pagination-numbers' ],
	[ 'core/comments-pagination-next' ],
];

export const settings: BlockModule< CommentsPaginationAttributes >[ 'settings' ] & {
	template: TemplateItem[];
} = {
	icon,
	template: TEMPLATE,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
