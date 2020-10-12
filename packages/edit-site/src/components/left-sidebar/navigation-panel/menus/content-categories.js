/**
 * WordPress dependencies
 */
import { __experimentalNavigationMenu as NavigationMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationEntityItems from '../navigation-entity-items';

export default function ContentCategoriesMenu() {
	return (
		<NavigationMenu
			menu="content-categories"
			title={ __( 'Categories' ) }
			parentMenu="root"
		>
			<NavigationEntityItems kind="taxonomy" name="category" />
		</NavigationMenu>
	);
}
