import { category as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import variations from './variations';
import type { CategoriesAttributes } from './types';

const { name } = metadata;

export { metadata, name };

export const settings: BlockModule< CategoriesAttributes >[ 'settings' ] = {
	icon,
	example: {},
	edit,
	variations,
};

export const init = () =>
	initBlock( {
		name,
		metadata,
		settings,
	} );
