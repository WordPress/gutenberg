/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import SidebarNavigationScreenDetailsPanelLabel from './sidebar-navigation-screen-details-panel-label';
import SidebarNavigationScreenDetailsPanelRow from './sidebar-navigation-screen-details-panel-row';
import SidebarNavigationScreenDetailsPanelValue from './sidebar-navigation-screen-details-panel-value';

function SidebarNavigationScreenDetailsPanel( { title, children, spacing } ) {
	return (
		<VStack
			className="edit-site-sidebar-navigation-details-screen-panel"
			spacing={ spacing }
		>
			{ title && (
				<Heading
					className="edit-site-sidebar-navigation-details-screen-panel__heading"
					level={ 2 }
				>
					{ title }
				</Heading>
			) }
			{ children }
		</VStack>
	);
}

export {
	SidebarNavigationScreenDetailsPanel,
	SidebarNavigationScreenDetailsPanelRow,
	SidebarNavigationScreenDetailsPanelLabel,
	SidebarNavigationScreenDetailsPanelValue,
};
