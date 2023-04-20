/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import PatternEdit from './edit';
import PatternSave from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	edit: PatternEdit,
	save: PatternSave,
};

export const init = () => initBlock( { name, metadata, settings } );
