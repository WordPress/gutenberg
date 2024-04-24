/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import metadata from './block.json';
import transforms from './transforms';

/**
 * WordPress dependencies
 */
import { link } from '@wordpress/icons';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon: link,
	edit,
	save,
	transforms,
};

export const init = () => initBlock( { name, metadata, settings } );
