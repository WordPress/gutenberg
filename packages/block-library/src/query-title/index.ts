import { title as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import variations from './variations';
import deprecated from './deprecated';
import type { QueryTitleAttributes } from './types';

const { name } = metadata;
export { metadata, name };

export const settings: BlockModule< QueryTitleAttributes >[ 'settings' ] = {
	icon,
	edit,
	variations,
	deprecated,
};

export const init = () =>
	initBlock( {
		name,
		metadata: metadata as BlockModule< QueryTitleAttributes >[ 'metadata' ],
		settings,
	} );
