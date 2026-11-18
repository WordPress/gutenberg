import { tableOfContents as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	deprecated,
	edit,
	example: {},
};

export const init = () => initBlock( { name, metadata, settings } );
