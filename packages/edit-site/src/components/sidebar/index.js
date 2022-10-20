/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SiteIconAndTitle from '../site-icon-and-title';
import SidebarNavigationRoot from '../sidebar-navigation-root';

export function Sidebar() {
	return (
		<VStack alignment="top" spacing={ 10 }>
			<div className="edit-site-sidebar__logo">
				<Button
					href="index.php"
					aria-label={ __( 'Go back to the dashboard' ) }
				>
					<SiteIconAndTitle />
				</Button>
			</div>
			<div className="edit-site-sidebar__content">
				<SidebarNavigationRoot />
			</div>
		</VStack>
	);
}
