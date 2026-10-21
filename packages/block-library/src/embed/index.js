import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import metadata from './block.json';
import transforms from './transforms';
import variations from './variations';
import { embedContentIcon } from './icons';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon: embedContentIcon,
	edit,
	save,
	transforms,
	variations,
};

export const init = () => initBlock( { name, metadata, settings } );
