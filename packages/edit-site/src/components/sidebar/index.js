/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SiteIconAndTitle from '../site-icon-and-title';
import SidebarNavigationRoot from '../sidebar-navigation-root';

export function Sidebar() {
	return (
		<VStack alignment="top" spacing={ 10 }>
			<div className="edit-site-sidebar__logo">
				<Button href="index.php">
					<SiteIconAndTitle />
				</Button>
			</div>
			<div className="edit-site-sidebar__content">
				<SidebarNavigationRoot />
			</div>
		</VStack>
	);
}
