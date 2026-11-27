import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import edit from './edit';
import save from './save';
import metadata from './block.json';
import transforms from './transforms';
import variations from './variations';
import deprecated from './deprecated';
import { embedContentIcon } from './icons';
import type { EmbedAttributes } from './types';

const { name } = metadata;
export { metadata, name };

export const settings: BlockModule< EmbedAttributes >[ 'settings' ] = {
	icon: embedContentIcon,
	edit,
	save,
	transforms,
	variations,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
