import { breadcrumbs } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: breadcrumbs,
	example: {},
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
