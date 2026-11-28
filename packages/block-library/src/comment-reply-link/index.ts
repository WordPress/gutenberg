import { commentReplyLink as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';
import type { CommentReplyLinkAttributes } from './types';

const { name } = metadata;
export { metadata, name };

export const settings: BlockModule< CommentReplyLinkAttributes >[ 'settings' ] =
	{
		edit,
		icon,
		deprecated,
		example: {},
	};

export const init = () =>
	initBlock( {
		name,
		metadata:
			metadata as unknown as BlockModule< CommentReplyLinkAttributes >[ 'metadata' ],
		settings,
	} );
