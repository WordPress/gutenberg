/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalNavigatorBackButton as NavigatorBackButton,
} from '@wordpress/components';
import { isRTL, __, sprintf } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';

export default function SidebarNavigationTitle( { parentTitle, title } ) {
	return (
		<HStack spacing={ 4 } justify="flex-start">
			{ parentTitle ? (
				<NavigatorBackButton
					className="edit-site-sidebar-navigation-title__back"
					icon={ isRTL() ? chevronRight : chevronLeft }
					aria-label={ sprintf(
						/* translators: %s: previous page. */
						__( 'Navigate to the previous view: %s' ),
						parentTitle
					) }
				/>
			) : (
				<div className="edit-site-sidebar-navigation-title__icon-placeholder" />
			) }
			<div className="edit-site-sidebar-navigation-title">{ title }</div>
		</HStack>
	);
}
