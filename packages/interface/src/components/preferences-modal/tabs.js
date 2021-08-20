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
import { useMemo, useState } from '@wordpress/element';

const TOP_LEVEL_MENU_NAME = 'interface/preferences-modal-top-level-menu';

export default function PreferencesModalTabs( { tabs } ) {
	const isTabbedLayout = useViewportMatch( 'medium' );

	const [ activeTabName, setActiveTabName ] = useState();
	const currentTabContent = useMemo(
		() => tabs.find( ( tab ) => tab.name === activeTabName )?.content,
		[ tabs, activeTabName ]
	);

	if ( isTabbedLayout ) {
		return (
			<TabPanel
				className="interface-preferences-modal__tab-panel"
				tabs={ tabs }
				initialTabName={ tabs[ 0 ].name }
				onSelect={ setActiveTabName }
				orientation="vertical"
			>
				{ currentTabContent || tabs[ 0 ].content }
			</TabPanel>
		);
	}
	return (
		<Navigation
			className="interface-preferences-modal__navigation"
			activeMenu={ activeTabName }
			onActivateMenu={ setActiveTabName }
		>
			<NavigationMenu menu={ TOP_LEVEL_MENU_NAME }>
				{ tabs.map( ( tab ) => (
					<NavigationItem
						className="interface-preferences-modal__navigation-item"
						key={ tab.name }
						title={ tab.label }
						navigateToMenu={ tab.name }
					/>
				) ) }
			</NavigationMenu>
			{ tabs.map( ( tab ) => (
				<NavigationMenu
					key={ `${ tab.name }-menu` }
					menu={ tab.name }
					title={ tab.label }
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
