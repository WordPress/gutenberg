/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __experimentalNavigatorProvider as NavigatorProvider } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';
import SidebarNavigationScreenTemplates from '../sidebar-navigation-screen-templates';
import useSyncSidebarPathWithURL from '../sync-state-with-url/use-sync-sidebar-path-with-url';
import SidebarNavigationScreenNavigationMenus from '../sidebar-navigation-screen-navigation-menus';
import SaveButton from '../save-button';

function SidebarScreens() {
	useSyncSidebarPathWithURL();

	return (
		<>
			<SidebarNavigationScreenMain />
			<SidebarNavigationScreenNavigationMenus />
			<SidebarNavigationScreenTemplates postType="wp_template" />
			<SidebarNavigationScreenTemplates postType="wp_template_part" />
		</>
	);
}

function Sidebar() {
	const { isDirty } = useSelect( ( select ) => {
		const { __experimentalGetDirtyEntityRecords } = select( coreStore );
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		// The currently selected entity to display.
		// Typically template or template part in the site editor.
		return {
			isDirty: dirtyEntityRecords.length > 0,
		};
	}, [] );

	return (
		<>
			<NavigatorProvider
				className="edit-site-sidebar__content"
				initialPath="/"
			>
				<SidebarScreens />
			</NavigatorProvider>
			{ isDirty && (
				<div className="edit-site-sidebar__footer">
					<SaveButton />
				</div>
			) }
		</>
	);
}

export default memo( Sidebar );
