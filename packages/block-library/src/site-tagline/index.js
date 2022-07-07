/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import icon from './icon';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	deprecated,
};
