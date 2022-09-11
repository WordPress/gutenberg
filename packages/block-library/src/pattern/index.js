/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import PatternEdit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	edit: PatternEdit,
};

export const init = () => initBlock( { name, metadata, settings } );
