/**
 * WordPress dependencies
 */
import { page as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit.js';

const { name } = metadata;

export { metadata, name };

export const settings = {
	__experimentalLabel: ( { label } ) => label,
	icon,
	example: {},
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
