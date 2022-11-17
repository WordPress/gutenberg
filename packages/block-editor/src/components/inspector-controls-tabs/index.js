/**
 * WordPress dependencies
 */
import { TabPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { TAB_SETTINGS, TAB_APPEARANCE } from './utils';
import AppearanceTab from './appearance-tab';
import SettingsTab from './settings-tab';

const tabs = [ TAB_APPEARANCE, TAB_SETTINGS ];

export default function InspectorControlsTabs( {
	blockName,
	clientId,
	hasBlockStyles,
} ) {
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
			} }
		</TabPanel>
	);
}
