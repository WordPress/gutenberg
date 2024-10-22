/**
 * WordPress dependencies
 */
import { title as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	deprecated,
	example: {},
};

export const init = () => initBlock( { name, metadata, settings } );
