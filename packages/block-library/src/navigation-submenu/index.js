/**
 * WordPress dependencies
 */
import { page, addSubmenu } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: ( { context } ) => {
		if ( context === 'list-view' ) {
			return page;
		}
		return addSubmenu;
	},
	__experimentalLabel( attributes, { context } ) {
		const { label } = attributes;

		const customName = attributes?.metadata?.name;

		// In the list view, use the block's menu label as the label.
		// If the menu label is empty, fall back to the default label.
		if ( context === 'list-view' && ( customName || label ) ) {
			return attributes?.metadata?.name || label;
		}

		return label;
	},
	edit,
	save,
	transforms,
};

export const init = () => initBlock( { name, metadata, settings } );
