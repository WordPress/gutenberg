/**
 * WordPress dependencies
 */
import { fullscreen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import NavigationOverlayEdit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	edit: NavigationOverlayEdit,
	save,
	icon: fullscreen,
};

export const init = () => initBlock( { name, metadata, settings } );
