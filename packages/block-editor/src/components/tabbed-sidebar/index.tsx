import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';
import type { ForwardedRef } from 'react';
import { unlock } from '../../lock-unlock';
import type { TabbedSidebarProps } from './types';

const { Tabs: WCTabs } = unlock( componentsPrivateApis );

/**
 * A component that creates a tabbed sidebar with a close button.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/tabbed-sidebar/README.md
 *
 * @example
 * ```jsx
 * function MyTabbedSidebar() {
 *   return (
 *     <TabbedSidebar
 *       tabs={ [
 *         {
 *           name: 'tab1',
 *           title: 'Settings',
 *           panel: <PanelContents />,
 *         }
 *       ] }
 *       onClose={ () => {} }
 *       onSelect={ () => {} }
 *       defaultTabId="tab1"
 *       selectedTab="tab1"
 *       closeButtonLabel="Close sidebar"
 *     />
 *   );
 * }
 * ```
 *
 * @param props                  Component props.
 * @param props.defaultTabId     The ID of the tab to be selected by default when the component renders.
 * @param props.onClose          Function called when the close button is clicked.
 * @param props.onSelect         Function called when a tab is selected. Receives the selected tab's ID as an argument.
 * @param props.selectedTab      The ID of the currently selected tab.
 * @param props.tabs             Array of tab objects. Each tab should have: name (string), title (string),
 *                               panel (React.Node), and optionally panelRef (React.Ref).
 * @param props.closeButtonLabel Accessibility label for the close button.
 * @param ref                    Forward ref to the tabs list element.
 * @return The tabbed sidebar component.
 */
function TabbedSidebar(
	{
		defaultTabId,
		onClose,
		onSelect,
		selectedTab,
		tabs,
		closeButtonLabel,
	}: TabbedSidebarProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	return (
		<div className="block-editor-tabbed-sidebar">
			<WCTabs
				selectOnMove={ false }
				defaultTabId={ defaultTabId }
				onSelect={ onSelect }
				selectedTabId={ selectedTab }
			>
				<div className="block-editor-tabbed-sidebar__tablist-and-close-button">
					<Button
						className="block-editor-tabbed-sidebar__close-button"
						icon={ closeSmall }
						label={ closeButtonLabel }
						onClick={ () => onClose() }
						size="compact"
					/>

					<WCTabs.TabList
						className="block-editor-tabbed-sidebar__tablist"
						ref={ ref }
					>
						{ tabs.map( ( tab ) => (
							<WCTabs.Tab
								key={ tab.name }
								tabId={ tab.name }
								className="block-editor-tabbed-sidebar__tab"
							>
								{ tab.title }
							</WCTabs.Tab>
						) ) }
					</WCTabs.TabList>
				</div>
				{ tabs.map( ( tab ) => (
					<WCTabs.TabPanel
						key={ tab.name }
						tabId={ tab.name }
						focusable={ false }
						className="block-editor-tabbed-sidebar__tabpanel"
						ref={ tab.panelRef }
					>
						{ tab.panel }
					</WCTabs.TabPanel>
				) ) }
			</WCTabs>
		</div>
	);
}

export default forwardRef( TabbedSidebar );
