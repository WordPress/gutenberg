import { __ } from '@wordpress/i18n';
import { navigation as icon } from '@wordpress/icons';
import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import deprecated from './deprecated';
import getNavigationMenuBySlug from './get-navigation-menu-by-slug';
import getNavigationMenuTitle from './get-navigation-menu-title';
import { PRELOADED_NAVIGATION_MENUS_QUERY } from './constants';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			overlayMenu: 'never',
		},
		innerBlocks: [
			{
				name: 'core/navigation-link',
				attributes: {
					// translators: 'Home' as in a website's home page.
					label: __( 'Home' ),
					url: 'https://make.wordpress.org/',
				},
			},
			{
				name: 'core/navigation-link',
				attributes: {
					// translators: 'About' as in a website's about page.
					label: __( 'About' ),
					url: 'https://make.wordpress.org/',
				},
			},
			{
				name: 'core/navigation-link',
				attributes: {
					// translators: 'Contact' as in a website's contact page.
					label: __( 'Contact' ),
					url: 'https://make.wordpress.org/',
				},
			},
		],
	},
	edit,
	save,
	__experimentalLabel: ( { ref, slug } ) => {
		if ( ! ref && ! slug ) {
			return;
		}

		// A slug reference resolves against the loaded Navigation Menus rather
		// than a post ID, so the matching record is used directly.
		if ( slug ) {
			const navigationMenus = select( coreStore ).getEntityRecords(
				'postType',
				'wp_navigation',
				PRELOADED_NAVIGATION_MENUS_QUERY
			);

			return getNavigationMenuTitle(
				getNavigationMenuBySlug( navigationMenus, slug )
			);
		}

		const navigation = select( coreStore ).getEditedEntityRecord(
			'postType',
			'wp_navigation',
			ref
		);

		return getNavigationMenuTitle( navigation );
	},
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
