/**
 * WordPress dependencies
 */
import { tag as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import transforms from './transforms';
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {},
	edit,
	transforms,
};

export const init = () => initBlock( { name, metadata, settings } );
