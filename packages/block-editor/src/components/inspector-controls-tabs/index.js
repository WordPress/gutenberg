/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { TabPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { TAB_SETTINGS, TAB_STYLES, TAB_LIST_VIEW } from './utils';
import SettingsTab from './settings-tab';
import StylesTab from './styles-tab';
import InspectorControls from '../inspector-controls';
import { store as blockEditorStore } from '../../store';

export default function InspectorControlsTabs( {
	blockName,
	clientId,
	hasBlockStyles,
	tabs,
} ) {
	const initialTabName = useSelect( ( select ) => {
		const { getDefaultInspectorControlsTab } = select( blockEditorStore );
		return getDefaultInspectorControlsTab() ?? TAB_STYLES.name;
	}, [] );

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
					return (
						<div>
							<InspectorControls.Slot __experimentalGroup="list" />
						</div>
					);
				}
			} }
		</TabPanel>
	);
}
