/**
 * WordPress dependencies
 */
import { symbol as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import save from './save.js';

const { name } = metadata;

export { metadata, name };

export const settings = {
	deprecated,
	edit,
	icon,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
