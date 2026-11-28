import { commentAuthorName as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';
import type { CommentAuthorNameAttributes } from './types';

const { name } = metadata;
export { metadata, name };

export const settings: BlockModule< CommentAuthorNameAttributes >[ 'settings' ] =
	{
		icon,
		edit,
		deprecated,
		example: {},
	};

export const init = () => initBlock( { name, metadata, settings } );
