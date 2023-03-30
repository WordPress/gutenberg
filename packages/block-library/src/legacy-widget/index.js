/**
 * WordPress dependencies
 */
import { widget as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';
import initBlock from '../utils/init-block';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	transforms,
};

export const init = () => initBlock( { name, metadata, settings } );
