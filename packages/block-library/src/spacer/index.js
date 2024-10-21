/**
 * WordPress dependencies
 */
import { resizeCornerNE as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import transforms from './transforms';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	transforms,
	edit,
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
