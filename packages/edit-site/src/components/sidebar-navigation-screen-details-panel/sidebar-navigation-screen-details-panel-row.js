/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';

export default function SidebarNavigationScreenDetailsPanelRow( {
	label,
	children,
} ) {
	return (
		<HStack
			key={ label }
			spacing={ 5 }
			alignment="left"
			className="edit-site-sidebar-navigation-details-screen-panel__row"
		>
			{ children }
		</HStack>
	);
}
