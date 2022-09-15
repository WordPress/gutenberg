/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalView as View,
	__experimentalNavigatorBackButton as NavigatorBackButton,
	Button,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
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
						aria-label={ __( 'Navigate to the previous view' ) }
						href={ parentHref }
					>
						{ parentTitle }
					</BackComponent>
				</HStack>
			</View>
			<Heading
				level={ 3 }
				color="currentColor"
				style={ { padding: '8px' } }
			>
				{ title }
			</Heading>
		</VStack>
	);
}
