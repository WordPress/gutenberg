/**
 * WordPress dependencies
 */
import { __experimentalNavigationMenu as NavigationMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationEntityItems from '../navigation-entity-items';
import { MENU_CONTENT_CATEGORIES, MENU_ROOT } from '../constants';

export default function ContentCategoriesMenu() {
	return (
		<NavigationMenu
			menu={ MENU_CONTENT_CATEGORIES }
			title={ __( 'Categories' ) }
			parentMenu={ MENU_ROOT }
		>
			<NavigationEntityItems kind="taxonomy" name="category" />
		</NavigationMenu>
	);
}
