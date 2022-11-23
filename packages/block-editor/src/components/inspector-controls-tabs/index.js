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
import InspectorControls from '../inspector-controls';

export default function InspectorControlsTabs( {
	blockName,
	clientId,
	hasBlockStyles,
	tabs,
} ) {
	return (
		<TabPanel className="block-editor-block-inspector__tabs" tabs={ tabs }>
			{ ( tab ) => {
				if ( tab.name === TAB_SETTINGS.name ) {
					return (
						<SettingsTab showAdvancedControls={ !! blockName } />
					);
				}

				if ( tab.name === TAB_APPEARANCE.name ) {
					return (
						<AppearanceTab
							blockName={ blockName }
							clientId={ clientId }
							hasBlockStyles={ hasBlockStyles }
						/>
					);
				}

				if ( tab.name === TAB_LIST_VIEW.name ) {
					return (
						<InspectorControls.Slot __experimentalGroup="list" />
					);
				}
			} }
		</TabPanel>
	);
}
