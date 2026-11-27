import { __ } from '@wordpress/i18n';
import { queryPaginationNext as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import type { CommentsPaginationNextAttributes } from './types';

const { name } = metadata;
export { metadata, name };

export const settings: BlockModule< CommentsPaginationNextAttributes >[ 'settings' ] =
	{
		icon,
		edit,
		example: {
			attributes: {
				label: __( 'Newer Comments' ),
			},
		},
	};

export const init = () => initBlock( { name, metadata, settings } );
