/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import NavigationOverlayEdit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	edit: NavigationOverlayEdit,
};

export const init = () => initBlock( { name, metadata, settings } );
