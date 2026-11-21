import { share as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import variations from './variations';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
	variations,
};

export const init = () => initBlock( { name, metadata, settings } );
