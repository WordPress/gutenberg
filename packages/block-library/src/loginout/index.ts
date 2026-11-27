import { login as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import edit from './edit';
import metadata from './block.json';
import type { LoginOutAttributes } from './types';

const { name } = metadata;
export { metadata, name };

export const settings: BlockModule< LoginOutAttributes >[ 'settings' ] = {
	icon,
	edit,
};

export const init = () =>
	initBlock( {
		name,
		metadata: metadata as BlockModule< LoginOutAttributes >[ 'metadata' ],
		settings,
	} );
