/**
 * WordPress dependencies
 */
import { loop as icon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import variations from './variations';
import deprecated from './deprecated';
import queryInspectorControls from './hooks';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
	variations,
	deprecated,
};

export const init = () => {
	addFilter( 'editor.BlockEdit', 'core/query', queryInspectorControls );

	return initBlock( { name, metadata, settings } );
};
