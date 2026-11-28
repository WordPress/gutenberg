import { queryPaginationNumbers as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import type { QueryPaginationNumbersAttributes } from './types';

const { name } = metadata;
export { metadata, name };

export const settings: BlockModule< QueryPaginationNumbersAttributes >[ 'settings' ] =
	{
		icon,
		edit,
		example: {},
	};

export const init = () => initBlock( { name, metadata, settings } );
