import { widget as icon } from '@wordpress/icons';
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	transforms,
};
