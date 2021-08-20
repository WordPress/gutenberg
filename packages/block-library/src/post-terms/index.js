/**
 * Internal dependencies
 */
import metadata from './block.json' assert { type: 'json' };
import edit from './edit';
import variations from './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	variations,
	edit,
};
