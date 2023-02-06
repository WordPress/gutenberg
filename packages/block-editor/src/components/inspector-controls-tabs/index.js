/**
 * WordPress dependencies
 */
import { TabPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { TAB_SETTINGS, TAB_STYLES, TAB_LIST_VIEW } from './utils';
import SettingsTab from './settings-tab';
import StylesTab from './styles-tab';
import InspectorControls from '../inspector-controls';
import useIsListViewTabDisabled from './use-is-list-view-tab-disabled';

export default function InspectorControlsTabs( {
	blockName,
	clientId,
	hasBlockStyles,
	tabs,
} ) {
	// The tabs panel will mount before fills are rendered to the list view
	// slot. This means the list view tab isn't initially included in the
	// available tabs so the panel defaults selection to the settings tab
	// which at the time is the first tab. This check allows blocks known to
	// include the list view tab to set it as the tab selected by default.
	const initialTabName = ! useIsListViewTabDisabled( blockName )
		? TAB_LIST_VIEW.name
		: undefined;

	return (
		<TabPanel
			className="block-editor-block-inspector__tabs"
			tabs={ tabs }
			initialTabName={ initialTabName }
			key={ clientId }
		>
			{ ( tab ) => {
				if ( tab.name === TAB_SETTINGS.name ) {
					return (
						<SettingsTab showAdvancedControls={ !! blockName } />
					);
				}

				if ( tab.name === TAB_STYLES.name ) {
					return (
						<StylesTab
							blockName={ blockName }
							clientId={ clientId }
							hasBlockStyles={ hasBlockStyles }
						/>
					);
				}

				if ( tab.name === TAB_LIST_VIEW.name ) {
					return <InspectorControls.Slot group="list" />;
				}
			} }
		</TabPanel>
	);
}
