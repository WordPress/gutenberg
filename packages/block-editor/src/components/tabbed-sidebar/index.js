/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

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
 * @param {Object}   props                  Component props.
 * @param {string}   [props.defaultTabId]   The ID of the tab to be selected by default when the component renders.
 * @param {Function} props.onClose          Function called when the close button is clicked.
 * @param {Function} props.onSelect         Function called when a tab is selected. Receives the selected tab's ID as an argument.
 * @param {string}   props.selectedTab      The ID of the currently selected tab.
 * @param {Array}    props.tabs             Array of tab objects. Each tab should have: name (string), title (string),
 *                                          panel (React.Node), and optionally panelRef (React.Ref).
 * @param {string}   props.closeButtonLabel Accessibility label for the close button.
 * @param {Object}   ref                    Forward ref to the tabs list element.
 * @return {Element} The tabbed sidebar component.
 */
function TabbedSidebar(
	{ defaultTabId, onClose, onSelect, selectedTab, tabs, closeButtonLabel },
	ref
) {
	return (
		<div className="block-editor-tabbed-sidebar">
			<Tabs
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

					<Tabs.TabList
						className="block-editor-tabbed-sidebar__tablist"
						ref={ ref }
					>
						{ tabs.map( ( tab ) => (
							<Tabs.Tab
								key={ tab.name }
								tabId={ tab.name }
								className="block-editor-tabbed-sidebar__tab"
							>
								{ tab.title }
							</Tabs.Tab>
						) ) }
					</Tabs.TabList>
				</div>
				{ tabs.map( ( tab ) => (
					<Tabs.TabPanel
						key={ tab.name }
						tabId={ tab.name }
						focusable={ false }
						className="block-editor-tabbed-sidebar__tabpanel"
						ref={ tab.panelRef }
					>
						{ tab.panel }
					</Tabs.TabPanel>
				) ) }
			</Tabs>
		</div>
	);
}

export default forwardRef( TabbedSidebar );
