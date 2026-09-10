import { contents as icon } from '@wordpress/icons';
import edit from './edit';
import save from './save';
import deprecated from './deprecated';
import metadata from './block.json';
import initBlock from '../utils/init-block';

const { name } = metadata;

export { metadata, name };

const TEMPLATE = [ [ 'core/paragraph', {} ] ];

export const settings = {
	icon,
	template: TEMPLATE,
	edit,
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
