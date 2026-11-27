import { tag as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import transforms from './transforms';
import metadata from './block.json';
import edit from './edit';
import type { TagCloudAttributes } from './types';

const { name } = metadata;

export { metadata, name };

export const settings: BlockModule< TagCloudAttributes >[ 'settings' ] = {
	icon,
	example: {},
	edit,
	transforms,
};

export const init = () =>
	initBlock( {
		name,
		metadata,
		settings,
	} );
