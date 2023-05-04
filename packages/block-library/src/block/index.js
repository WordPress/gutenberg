/**
 * WordPress dependencies
 */
import { symbol as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	edit,
	save,
	icon,
};

export const init = () => initBlock( { name, metadata, settings } );
