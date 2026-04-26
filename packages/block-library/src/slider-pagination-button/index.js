/**
 * WordPress dependencies
 */
import { chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import metadata from './block.json';
import variations from './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon: chevronLeft,
	variations,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
