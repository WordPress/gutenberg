import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { SidebarNavigationScreenWrapper } from '../sidebar-navigation-screen-navigation-menus';
import SidebarNavigationScreenDetailsFooter from '../sidebar-navigation-screen-details-footer';
import ScreenNavigationMoreMenu from './more-menu';
import NavigationMenuEditor from './navigation-menu-editor';
import buildNavigationLabel from '../sidebar-navigation-screen-navigation-menus/build-navigation-label';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export default function SingleNavigationMenu( {
	navigationMenu,
	backPath,
	handleDelete,
	handleDuplicate,
	handleSave,
} ) {
	const history = useHistory();
	const menuTitle = navigationMenu?.title?.rendered;
	const revisionsCount =
		navigationMenu?._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0;
	const lastRevisionId =
		navigationMenu?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id ?? null;
	// Match the editor's Revisions panel: a single revision has nothing to
	// compare against.
	const hasRevisions = !! lastRevisionId && revisionsCount > 1;

	const openRevisions = () => {
		// The editor reads `revision` from the URL and opens its visual
		// revisions view on that revision.
		history.navigate(
			addQueryArgs( `/wp_navigation/${ navigationMenu.id }`, {
				canvas: 'edit',
				revision: lastRevisionId,
			} )
		);
	};

	return (
		<SidebarNavigationScreenWrapper
			actions={
				<>
					<ScreenNavigationMoreMenu
						menuId={ navigationMenu?.id }
						menuTitle={ decodeEntities( menuTitle ) }
						onDelete={ handleDelete }
						onSave={ handleSave }
						onDuplicate={ handleDuplicate }
					/>
				</>
			}
			backPath={ backPath }
			title={ buildNavigationLabel(
				navigationMenu?.title,
				navigationMenu?.id,
				navigationMenu?.status
			) }
			description={ __(
				'Navigation Menus are a curated collection of blocks that allow visitors to get around your site.'
			) }
			footer={
				hasRevisions && (
					<SidebarNavigationScreenDetailsFooter
						record={ navigationMenu }
						revisionsCount={ revisionsCount }
						onClick={ openRevisions }
					/>
				)
			}
		>
			<NavigationMenuEditor navigationMenuId={ navigationMenu?.id } />
		</SidebarNavigationScreenWrapper>
	);
}
