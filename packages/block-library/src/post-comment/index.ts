import { comment as icon } from '@wordpress/icons';
import type { TemplateItem } from '@wordpress/blocks';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import type { PostCommentAttributes } from './types';

const { name } = metadata;
export { metadata, name };

const TEMPLATE: TemplateItem[] = [
	[ 'core/avatar' ],
	[ 'core/comment-author-name' ],
	[ 'core/comment-date' ],
	[ 'core/comment-content' ],
	[ 'core/comment-reply-link' ],
	[ 'core/comment-edit-link' ],
];

export const settings: BlockModule< PostCommentAttributes >[ 'settings' ] & {
	template: TemplateItem[];
} = {
	icon,
	template: TEMPLATE,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
