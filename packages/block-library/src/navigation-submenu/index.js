import { page, addSubmenu } from '@wordpress/icons';
import { __, _x, sprintf } from '@wordpress/i18n';
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
		const { label, url } = attributes;

		const customName = attributes?.metadata?.name;

		// In the list view and breadcrumb, use the block's menu label as the label.
		// If the menu label is empty, fall back to the default label.
		if (
			( context === 'list-view' || context === 'breadcrumb' ) &&
			customName
		) {
			return customName;
		}

		// Mark a submenu without a link in the list view, so it's clear that
		// it only opens its dropdown.
		const hasUrlBinding = !! attributes?.metadata?.bindings?.url;
		if ( context === 'list-view' && label && ! url && ! hasUrlBinding ) {
			return sprintf(
				/* translators: %s: The text of a submenu that has no link. */
				__( '%s (label only)' ),
				label
			);
		}

		return label;
	},
	edit,
	example: {
		attributes: {
			label: _x( 'About', 'Example link text for Navigation Submenu' ),
			type: 'page',
		},
	},
	save,
	transforms,
};

export const init = () => initBlock( { name, metadata, settings } );
