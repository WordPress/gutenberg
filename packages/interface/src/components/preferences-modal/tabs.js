/**
 * WordPress dependencies
 */
import {
	__experimentalNavigation as Navigation,
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationItem as NavigationItem,
	TabPanel,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useCallback, useState } from '@wordpress/element';

const TOP_LEVEL_MENU_NAME = 'interface/preferences-modal-top-level-menu';

export default function PreferencesModalTabs( { tabs } ) {
	const isTabbedLayout = useViewportMatch( 'medium' );
	const [ activeTabName, setActiveTabName ] = useState();

	// Tab panel requires a callback child, so make one.
	const getCurrentTabContent = useCallback(
		() =>
			tabs.find( ( tab ) => tab.name === activeTabName )?.content ||
			tabs[ 0 ].content,
		[ tabs, activeTabName ]
	);

	// On big screens, do a tabbed layout.
	if ( isTabbedLayout ) {
		return (
			<TabPanel
				className="interface-preferences-modal__tab-panel"
				tabs={ tabs }
				initialTabName={ tabs[ 0 ].name }
				onSelect={ setActiveTabName }
				orientation="vertical"
			>
				{ getCurrentTabContent }
			</TabPanel>
		);
	}

	// One little screens, do a navigation layout.
	return (
		<Navigation
			className="interface-preferences-modal__navigation"
			activeMenu={ activeTabName || TOP_LEVEL_MENU_NAME }
			onActivateMenu={ setActiveTabName }
		>
			<NavigationMenu
				className="interface-preferences-modal__navigation-menu"
				menu={ TOP_LEVEL_MENU_NAME }
			>
				{ tabs.map( ( tab ) => (
					<NavigationItem
						className="interface-preferences-modal__navigation-item"
						key={ tab.name }
						title={ tab.title }
						navigateToMenu={ tab.name }
					/>
				) ) }
			</NavigationMenu>
			{ tabs.map( ( tab ) => (
				<NavigationMenu
					key={ `${ tab.name }-menu` }
					className="interface-preferences-modal__navigation-menu"
					menu={ tab.name }
					title={ tab.title }
					parentMenu={ TOP_LEVEL_MENU_NAME }
				>
					<NavigationItem className="interface-preferences-modal__navigation-item">
						{ tab.content }
					</NavigationItem>
				</NavigationMenu>
			) ) }
		</Navigation>
	);
}
