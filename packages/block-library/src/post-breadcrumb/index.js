/**
 * WordPress dependencies
 */
import { moreHorizontal } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: moreHorizontal,
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
