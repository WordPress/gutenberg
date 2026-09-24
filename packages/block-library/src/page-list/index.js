import { pages } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit.jsx';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: pages,
	example: {},
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
