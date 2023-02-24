/**
 * WordPress dependencies
 */
import { memo, useRef } from '@wordpress/element';
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SidebarNavigationScreenMain from '../sidebar-navigation-screen-main';
import SidebarNavigationScreenTemplates from '../sidebar-navigation-screen-templates';
import SidebarNavigationScreenTemplate from '../sidebar-navigation-screen-template';
import useSyncPathWithURL, {
	getPathFromURL,
} from '../sync-state-with-url/use-sync-path-with-url';
import SidebarNavigationScreenNavigationMenus from '../sidebar-navigation-screen-navigation-menus';
import SidebarNavigationScreenTemplatesBrowse from '../sidebar-navigation-screen-templates-browse';
import SaveButton from '../save-button';
import SidebarNavigationScreenNavigationItem from '../sidebar-navigation-screen-navigation-item';
import { useLocation } from '../routes';

function SidebarScreens() {
	useSyncPathWithURL();

	return (
		<>
			<NavigatorScreen path="/">
				<SidebarNavigationScreenMain />
			</NavigatorScreen>
			<NavigatorScreen path="/navigation">
				<SidebarNavigationScreenNavigationMenus />
			</NavigatorScreen>
			<NavigatorScreen path="/navigation/:postType/:postId">
				<SidebarNavigationScreenNavigationItem />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template|wp_template_part)">
				<SidebarNavigationScreenTemplates />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template|wp_template_part)/all">
				<SidebarNavigationScreenTemplatesBrowse />
			</NavigatorScreen>
			<NavigatorScreen path="/:postType(wp_template|wp_template_part)/:postId">
				<SidebarNavigationScreenTemplate />
			</NavigatorScreen>
		</>
	);
}

function Sidebar() {
	const { params: urlParams } = useLocation();
	const initialPath = useRef( getPathFromURL( urlParams ) );
	const { isDirty, isSaving } = useSelect( ( select ) => {
		const { __experimentalGetDirtyEntityRecords, isSavingEntityRecord } =
			select( coreStore );
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		// The currently selected entity to display.
		// Typically template or template part in the site editor.
		return {
			isDirty: dirtyEntityRecords.length > 0,
			isSaving: dirtyEntityRecords.some( ( record ) =>
				isSavingEntityRecord( record.kind, record.name, record.key )
			),
		};
	}, [] );
	// The wasDirty variable is used to prevent the save button from showing
	// in the sidebar if the saving was triggered without edits.
	// For instance: when renaming templates.
	const wasDirty = usePrevious( isDirty );

	return (
		<>
			<NavigatorProvider
				className="edit-site-sidebar__content"
				initialPath={ initialPath.current }
			>
				<SidebarScreens />
			</NavigatorProvider>
			{ ( ( isSaving && wasDirty ) || ( isDirty && ! isSaving ) ) && (
				<div className="edit-site-sidebar__footer">
					<SaveButton showTooltip={ false } />
				</div>
			) }
		</>
	);
}

export default memo( Sidebar );
