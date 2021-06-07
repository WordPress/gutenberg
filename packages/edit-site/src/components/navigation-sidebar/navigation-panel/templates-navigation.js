/**
 * WordPress dependencies
 */
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationBackButton as NavigationBackButton,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TemplatesMenu from './menus/templates';
import TemplatePartsMenu from './menus/template-parts';
import MainDashboardButton from '../../main-dashboard-button';
import { MENU_ROOT, MENU_TEMPLATE_PARTS, MENU_TEMPLATES } from './constants';
import { store as editSiteStore } from '../../../store';

export default function TemplatesNavigation( { skipAnimation } ) {
	const { postId, postType, activeMenu } = useSelect( ( select ) => {
		const {
			getEditedPostType,
			getEditedPostId,
			getNavigationPanelActiveMenu,
		} = select( editSiteStore );

		return {
			postId: getEditedPostId(),
			postType: getEditedPostType(),
			activeMenu: getNavigationPanelActiveMenu(),
		};
	}, [] );

	const { setNavigationPanelActiveMenu } = useDispatch( editSiteStore );

	return (
		<Navigation
			activeItem={ `${ postType }-${ postId }` }
			activeMenu={ activeMenu }
			onActivateMenu={ setNavigationPanelActiveMenu }
			skipAnimation={ skipAnimation }
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

			<NavigationMenu title={ __( 'Theme' ) }>
				<NavigationItem
					title={ __( 'Templates' ) }
					navigateToMenu={ MENU_TEMPLATES }
				/>

				<NavigationItem
					title={ __( 'Template Parts' ) }
					navigateToMenu={ MENU_TEMPLATE_PARTS }
				/>

				<TemplatesMenu />
				<TemplatePartsMenu />
			</NavigationMenu>
		</Navigation>
	);
}
