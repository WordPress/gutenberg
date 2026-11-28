import { queryPaginationPrevious as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import type { QueryPaginationPreviousAttributes } from './types';

const { name } = metadata;
export { metadata, name };

export const settings: BlockModule< QueryPaginationPreviousAttributes >[ 'settings' ] =
	{
		icon,
		edit,
	};

export const init = () => initBlock( { name, metadata, settings } );
