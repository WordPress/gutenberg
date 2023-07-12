/**
 * WordPress dependencies
 */
import { postCategories as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import createVariations from './hooks';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
};

export const init = () => {
	createVariations();

	return initBlock( { name, metadata, settings } );
};
