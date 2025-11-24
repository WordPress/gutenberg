/**
 * WordPress dependencies
 */
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import metadata from './block.json';
import initBlock from '../utils/init-block';
import icon from './icon';
import { unlock } from '../lock-unlock';

const { compositeChildKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
	[ compositeChildKey ]: true,
};

export const init = () =>
	initBlock( {
		name,
		metadata,
		settings,
	} );
