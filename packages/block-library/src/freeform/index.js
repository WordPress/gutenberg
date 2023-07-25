/**
 * WordPress dependencies
 */
import { classic as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
