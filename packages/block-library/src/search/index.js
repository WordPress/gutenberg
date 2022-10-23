/**
 * WordPress dependencies
 */
import { search as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import variations from './variations';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {},
	variations,
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
