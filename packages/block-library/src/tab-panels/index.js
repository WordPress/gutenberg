import { contents as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import metadata from './block.json';

/**
 * Initial template applied only when the block is first inserted (i.e. when
 * inner blocks are empty). templateLock is false, so this is never applied to
 * existing blocks that already have tab panels saved.
 */
const TAB_PANELS_TEMPLATE = [ [ 'core/tab-panel' ], [ 'core/tab-panel' ] ];

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	template: TAB_PANELS_TEMPLATE,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
