/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalNavigatorBackButton as NavigatorBackButton,
	Button,
} from '@wordpress/components';
import { isRTL, __, sprintf } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';

export default function SidebarNavigationTitle( {
	parentHref,
	parentTitle,
	title,
} ) {
	const BackComponent = parentHref ? Button : NavigatorBackButton;
	return (
		<HStack spacing={ 4 } justify="flex-start">
			<BackComponent
				className="edit-site-sidebar-navigation-title__back"
				icon={ isRTL() ? chevronRight : chevronLeft }
				aria-label={ sprintf(
					/* translators: %s: previous page. */
					__( 'Navigate to the previous view: %s' ),
					parentTitle
				) }
				href={ parentHref }
			/>
			<div className="edit-site-sidebar-navigation-title">{ title }</div>
		</HStack>
	);
}
