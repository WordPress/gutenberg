import { postComments as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import TEMPLATE from './edit/template';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	example: {},
	template: TEMPLATE,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
