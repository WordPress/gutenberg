import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: null,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
