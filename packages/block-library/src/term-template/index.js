/**
 * WordPress dependencies
 */
import { layout as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

const TEMPLATE = [ [ 'core/term-name' ] ];

export const settings = {
	icon,
	template: TEMPLATE,
	edit,
	save,
	example: {},
};

export const init = () => initBlock( { name, metadata, settings } );
