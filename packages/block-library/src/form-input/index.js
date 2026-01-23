/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import variations from './variations';
import { icon } from './icons';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	deprecated,
	edit,
	save,
	variations,
	example: {},
};

export const init = () => initBlock( { name, metadata, settings } );
