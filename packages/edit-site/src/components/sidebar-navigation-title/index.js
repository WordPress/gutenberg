/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalView as View,
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
		<VStack spacing={ 10 }>
			<View>
				<HStack spacing={ 2 }>
					<BackComponent
						className="edit-site-sidebar-navigation-title__back"
						icon={ isRTL() ? chevronRight : chevronLeft }
						aria-label={ sprintf(
							/* translators: %s: previous page. */
							__( 'Navigate to the previous view: %s' ),
							parentTitle
						) }
						href={ parentHref }
					>
						{ parentTitle }
					</BackComponent>
				</HStack>
			</View>
			<div className="edit-site-sidebar-navigation-title">{ title }</div>
		</VStack>
	);
}
