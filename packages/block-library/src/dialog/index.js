/**
 * WordPress dependencies
 */
import { register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import metadata from './block.json';
import { store } from './store';

const { name } = metadata;

export { metadata, name };

export const settings = {
	edit,
	save,
};

export const init = () => {
	register( store );
	return initBlock( { name, metadata, settings } );
};
