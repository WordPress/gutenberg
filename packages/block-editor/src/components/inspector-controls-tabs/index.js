/**
 * WordPress dependencies
 */
import { TabPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { TAB_SETTINGS, TAB_APPEARANCE, TAB_LIST_VIEW } from './utils';
import AppearanceTab from './appearance-tab';
import SettingsTab from './settings-tab';
import { default as ListViewTab, useIsListViewDisabled } from './list-view-tab';

const defaultTabs = [ TAB_APPEARANCE, TAB_SETTINGS ];
const tabsWithListView = [ TAB_LIST_VIEW, TAB_APPEARANCE, TAB_SETTINGS ];

export default function InspectorControlsTabs( {
	blockName,
	clientId,
	hasBlockStyles,
} ) {
	const tabs = useIsListViewDisabled( blockName )
		? defaultTabs
		: tabsWithListView;

	return (
		<TabPanel className="block-editor-block-inspector__tabs" tabs={ tabs }>
			{ ( tab ) => {
				if ( tab.name === TAB_SETTINGS.name ) {
					return (
						<SettingsTab hasSingleBlockSelection={ !! blockName } />
					);
				}

				if ( tab.name === TAB_APPEARANCE.name ) {
					return (
						<AppearanceTab
							blockName={ blockName }
							clientId={ clientId }
							hasBlockStyles={ hasBlockStyles }
							hasSingleBlockSelection={ !! blockName }
						/>
					);
				}

				if ( tab.name === TAB_LIST_VIEW.name ) {
					return (
						<ListViewTab
							blockName={ blockName }
							hasSingleBlockSelection={ !! blockName }
						/>
					);
				}
			} }
		</TabPanel>
	);
}
