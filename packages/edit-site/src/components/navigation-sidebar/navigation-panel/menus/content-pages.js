/**
 * WordPress dependencies
 */
import { __experimentalNavigationMenu as NavigationMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationEntityItems from '../navigation-entity-items';
import { MENU_CONTENT_PAGES, MENU_ROOT } from '../constants';

export default function ContentPagesMenu() {
	return (
		<NavigationMenu
			menu={ MENU_CONTENT_PAGES }
			title={ __( 'Pages' ) }
			parentMenu={ MENU_ROOT }
		>
			<NavigationEntityItems kind="postType" name="page" />
		</NavigationMenu>
	);
}
