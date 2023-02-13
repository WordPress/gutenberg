/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalNavigatorToParentButton as NavigatorToParentButton,
	__experimentalNavigatorScreen as NavigatorScreen,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';

export default function SidebarNavigationScreen( {
	path,
	title,
	actions,
	content,
} ) {
	return (
		<NavigatorScreen
			className="edit-site-sidebar-navigation-screen"
			path={ path }
		>
			<VStack spacing={ 2 }>
				<HStack
					spacing={ 4 }
					justify="flex-start"
					className="edit-site-sidebar-navigation-screen__title-icon"
				>
					{ path !== '/' ? (
						<NavigatorToParentButton
							className="edit-site-sidebar-navigation-screen__back"
							icon={ isRTL() ? chevronRight : chevronLeft }
							aria-label={ __( 'Back' ) }
						/>
					) : (
						<NavigatorBackButton
							className="edit-site-sidebar-navigation-screen__back"
							icon={ isRTL() ? chevronRight : chevronLeft }
							aria-label={ __( 'Navigate to the Dashboard' ) }
							href="../wp-admin"
						/>
						// <NavigationBackButton
						// 	className="edit-site-sidebar-navigation-screen__back"
						// 	icon={ isRTL() ? chevronRight : chevronLeft }
						// 	aria-label={ __( 'Navigate to the Dashboard' ) }
						// 	href="../wp-admin"
						// 	backButtonLabel=" "
						// />
					) }
					<h2 className="edit-site-sidebar-navigation-screen__title">
						{ title }
					</h2>
					{ actions }
				</HStack>

				<nav className="edit-site-sidebar-navigation-screen__content">
					{ content }
				</nav>
			</VStack>
		</NavigatorScreen>
	);
}
