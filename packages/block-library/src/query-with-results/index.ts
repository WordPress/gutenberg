import { check as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

const TEMPLATE = [ [ 'core/post-template' ], [ 'core/query-pagination' ] ];

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	template: TEMPLATE,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
