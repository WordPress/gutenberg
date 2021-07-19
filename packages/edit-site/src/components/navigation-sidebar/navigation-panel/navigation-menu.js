/**
 * WordPress dependencies
 */
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationBackButton as NavigationBackButton,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SiteMenu from './menus';
import MainDashboardButton from '../../main-dashboard-button';
import { store as editSiteStore } from '../../../store';
import { MENU_ROOT } from './constants';

export default function NavigationMenu() {
	const {
		activeMenu,
		editedPostId,
		editedPostType,
		page: { context: { postType, postId } = {} } = {},
	} = useSelect( ( select ) => {
		const {
			getEditedPostId,
			getEditedPostType,
			getNavigationPanelActiveMenu,
			getPage,
		} = select( editSiteStore );

		return {
			activeMenu: getNavigationPanelActiveMenu(),
			editedPostId: getEditedPostId(),
			editedPostType: getEditedPostType(),
			page: getPage(),
		};
	}, [] );

	const { setNavigationPanelActiveMenu } = useDispatch( editSiteStore );

	let activeItem;
	if ( activeMenu !== MENU_ROOT ) {
		if ( activeMenu.startsWith( 'content' ) ) {
			activeItem = `${ postType }-${ postId }`;
		} else {
			activeItem = `${ editedPostType }-${ editedPostId }`;
		}
	}

	return (
		<Navigation
			activeItem={ activeItem }
			activeMenu={ activeMenu }
			onActivateMenu={ setNavigationPanelActiveMenu }
		>
			{ activeMenu === MENU_ROOT && (
				<MainDashboardButton.Slot>
					<NavigationBackButton
						backButtonLabel={ __( 'Dashboard' ) }
						className="edit-site-navigation-panel__back-to-dashboard"
						href="index.php"
					/>
				</MainDashboardButton.Slot>
			) }
			<SiteMenu />
		</Navigation>
	);
}
