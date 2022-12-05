/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalNavigatorBackButton as NavigatorBackButton,
} from '@wordpress/components';
import { isRTL, __, sprintf } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';

export default function SidebarNavigationScreen( {
	parentTitle,
	title,
	content,
} ) {
	return (
		<VStack spacing={ 6 }>
			<HStack spacing={ 4 } justify="flex-start">
				{ parentTitle ? (
					<NavigatorBackButton
						className="edit-site-sidebar-navigation-screen__back"
						icon={ isRTL() ? chevronRight : chevronLeft }
						aria-label={ sprintf(
							/* translators: %s: previous page. */
							__( 'Navigate to the previous view: %s' ),
							parentTitle
						) }
					/>
				) : (
					<div className="edit-site-sidebar-navigation-screen__icon-placeholder" />
				) }

				<div className="edit-site-sidebar-navigation-screen__title">
					{ title }
				</div>
			</HStack>

			<nav className="edit-site-sidebar-navigation-screen__content">
				{ content }
			</nav>
		</VStack>
	);
}
