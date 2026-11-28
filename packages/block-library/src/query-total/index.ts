import metadata from './block.json';
import edit from './edit';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import { queryTotal } from './icons';
import type { QueryTotalAttributes } from './types';

/* Block settings */
const { name } = metadata;
export { metadata, name };

export const settings: BlockModule< QueryTotalAttributes >[ 'settings' ] = {
	icon: queryTotal,
	edit,
};

export const init = () =>
	initBlock( {
		name,
		metadata: metadata as BlockModule< QueryTotalAttributes >[ 'metadata' ],
		settings,
	} );
