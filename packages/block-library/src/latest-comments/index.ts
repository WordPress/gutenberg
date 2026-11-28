import { comment as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';
import type { LatestCommentsAttributes } from './types';

const { name } = metadata;

export { metadata, name };

export const settings: BlockModule< LatestCommentsAttributes >[ 'settings' ] = {
	icon,
	example: {},
	edit,
	deprecated,
};

export const init = () =>
	initBlock( {
		name,
		metadata:
			metadata as BlockModule< LatestCommentsAttributes >[ 'metadata' ],
		settings,
	} );
