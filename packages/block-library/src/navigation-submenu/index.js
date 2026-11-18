import { page, addSubmenu } from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import isNavigationMenuEditingEnabled from '../navigation/menu-list-view/is-enabled';
import isLabelOnlySubmenu from './is-label-only';
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

		// In the list view and breadcrumb, use the block's menu label as the label.
		// If the menu label is empty, fall back to the default label.
		if (
			( context === 'list-view' || context === 'breadcrumb' ) &&
			customName
		) {
			return customName;
		}

		return label;
	},
	// A label-only submenu (#86936) has no link of its own and only opens its
	// items. As a variation it gets its own icon, title and description in
	// the list view and block card, so it reads as different from a link.
	variations: isNavigationMenuEditingEnabled()
		? [
				{
					name: 'label-only',
					title: __( 'Label-only submenu' ),
					description: __(
						'A submenu heading that doesn’t link anywhere. It opens and closes its items.'
					),
					icon: addSubmenu,
					attributes: {},
					isActive: ( blockAttributes ) =>
						isLabelOnlySubmenu( blockAttributes ),
					scope: [],
				},
			]
		: undefined,
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
