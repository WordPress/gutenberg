/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalNavigatorToParentButton as NavigatorToParentButton,
	Button,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../private-apis';

export default function SidebarNavigationScreen( {
	isRoot,
	title,
	actions,
	content,
} ) {
	const { dashboardLink } = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );
		return {
			dashboardLink: getSettings().__experimentalDashboardLink,
		};
	}, [] );

	return (
		<VStack spacing={ 2 }>
			<HStack
				spacing={ 4 }
				justify="flex-start"
				className="edit-site-sidebar-navigation-screen__title-icon"
			>
				{ ! isRoot ? (
					<NavigatorToParentButton
						className="edit-site-sidebar-navigation-screen__back"
						icon={ isRTL() ? chevronRight : chevronLeft }
						aria-label={ __( 'Back' ) }
					/>
				) : (
					<Button
						className="edit-site-sidebar-navigation-screen__back"
						icon={ isRTL() ? chevronRight : chevronLeft }
						aria-label={ __( 'Navigate to the Dashboard' ) }
						href={ dashboardLink || 'index.php' }
						label={ __( 'Dashboard' ) }
					/>
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
	);
}
