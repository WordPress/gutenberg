/**
 * Internal dependencies
 */
import metadata from './block.json';
import PatternEdit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	edit: PatternEdit,
};
