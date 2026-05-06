/**
 * WordPress dependencies
 */
import { postFeaturedImage as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './deprecated-edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
