/**
 * WordPress dependencies
 */
import { __experimentalNavigatorProvider as NavigatorProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreenMain from './screen-main';

export default function SidebarNavigationRoot() {
	return (
		<NavigatorProvider initialPath="/">
			<SidebarNavigationScreenMain />
		</NavigatorProvider>
	);
}
