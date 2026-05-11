/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import initBlock from '../utils/init-block';
import { queryTotal } from './icons';

/* Block settings */
const { name } = metadata;
export { metadata, name };

export const settings = {
	icon: queryTotal,
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
