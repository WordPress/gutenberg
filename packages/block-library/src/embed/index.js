/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import metadata from './block.json';
import transforms from './transforms';
import variations from './variations';
import deprecated from './deprecated';
import { embedContentIcon } from './icons';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon: embedContentIcon,
	edit,
	save,
	transforms,
	variations,
	deprecated,
};
