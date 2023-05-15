/**
 * WordPress dependencies
 */
import { group as icon } from '@wordpress/icons';
import { registerFormatType } from '@wordpress/rich-text';
import { addFilter } from '@wordpress/hooks';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import { format } from './format';
import { unlock } from '../private-apis';
import hor from './higher-order-reducer';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
};

const { horKey } = unlock( blockEditorPrivateApis );

// Would be good to remove the format and HoR if the block is unregistered.
registerFormatType( 'core/footnote', format );
addFilter( horKey, name, hor );

export const init = () => {
	initBlock( { name, metadata, settings } );
};
