/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

function TabbedSidebar(
	{ defaultTabId, onClose, onSelect, selectedTab, tabs },
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
						label={ __( 'Close block inserter' ) }
						onClick={ () => onClose() }
						size="small"
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
