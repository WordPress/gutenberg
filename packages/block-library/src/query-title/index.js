/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import variations from './variations';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	edit,
	variations,
	deprecated,
};
