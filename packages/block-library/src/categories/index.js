/**
 * WordPress dependencies
 */
import { category as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import variations from './variations';
import deprecated from './deprecated';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {},
	edit,
	variations,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
