import { shortcode as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import transforms from './transforms';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	transforms,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
