/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalNavigatorToParentButton as NavigatorToParentButton,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SidebarButton from '../sidebar-button';

export default function SidebarNavigationScreen( {
	isRoot,
	title,
	actions,
	content,
	description,
} ) {
	return (
		<VStack spacing={ 2 }>
			<HStack
				spacing={ 4 }
				justify="flex-start"
				className="edit-site-sidebar-navigation-screen__title-icon"
			>
				{ ! isRoot ? (
					<NavigatorToParentButton
						as={ SidebarButton }
						icon={ isRTL() ? chevronRight : chevronLeft }
						aria-label={ __( 'Back' ) }
					/>
				) : (
					<SidebarButton
						icon={ isRTL() ? chevronRight : chevronLeft }
						aria-label={ __( 'Navigate to the Dashboard' ) }
						href={ 'index.php' }
						label={ __( 'Dashboard' ) }
					/>
				) }
				<h2 className="edit-site-sidebar-navigation-screen__title">
					{ title }
				</h2>
				{ actions }
			</HStack>

			<nav className="edit-site-sidebar-navigation-screen__content">
				{ description && (
					<p className="edit-site-sidebar-navigation-screen__description">
						{ description }
					</p>
				) }
				{ content }
			</nav>
		</VStack>
	);
}
