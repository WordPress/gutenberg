/**
 * WordPress dependencies
 */
import { more as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {},
	__experimentalLabel( attributes, { context } ) {
		const customName = attributes?.metadata?.name;

		if ( context === 'list-view' && customName ) {
			return customName;
		}

		if ( context === 'accessibility' ) {
			return attributes.customText;
		}
	},
	transforms,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
