import { commentAuthorAvatar as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import type { CommentAuthorAvatarAttributes } from './types';

const { name } = metadata;
export { metadata, name };

export const settings: BlockModule< CommentAuthorAvatarAttributes >[ 'settings' ] =
	{
		icon,
		edit,
	};

export const init = () =>
	initBlock( {
		name,
		metadata:
			metadata as BlockModule< CommentAuthorAvatarAttributes >[ 'metadata' ],
		settings,
	} );
