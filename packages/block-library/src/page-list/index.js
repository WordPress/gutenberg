import { pages } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import transforms from './transforms.js';
import edit from './edit.js';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: pages,
	example: {},
	edit,
	transforms,
};

export const init = () => initBlock( { name, metadata, settings } );
