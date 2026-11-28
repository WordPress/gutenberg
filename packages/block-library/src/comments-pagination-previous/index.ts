import { __ } from '@wordpress/i18n';
import { queryPaginationPrevious as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import type { CommentsPaginationPreviousAttributes } from './types';

const { name } = metadata;
export { metadata, name };

export const settings: BlockModule< CommentsPaginationPreviousAttributes >[ 'settings' ] =
	{
		icon,
		edit,
		example: {
			attributes: {
				label: __( 'Older Comments' ),
			},
		},
	};

export const init = () => initBlock( { name, metadata, settings } );
