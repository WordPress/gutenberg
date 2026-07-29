/**
 * WordPress dependencies
 */
import { pages } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit, { transforms } from './edit.js';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: pages,
	example: {},
	edit,
	transforms,
};

export const init = () => initBlock( { name, metadata, settings } );
