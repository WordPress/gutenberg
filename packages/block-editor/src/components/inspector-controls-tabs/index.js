/**
 * WordPress dependencies
 */
import {
	Icon,
	Tooltip,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { TAB_SETTINGS, TAB_STYLES, TAB_LIST_VIEW } from './utils';
import SettingsTab from './settings-tab';
import StylesTab from './styles-tab';
import InspectorControls from '../inspector-controls';
import useIsListViewTabDisabled from './use-is-list-view-tab-disabled';
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

export default function InspectorControlsTabs( {
	blockName,
	clientId,
	hasBlockStyles,
	tabs,
} ) {
	const showIconLabels = useSelect( ( select ) => {
		return select( preferencesStore ).get( 'core', 'showIconLabels' );
	}, [] );

	// The tabs panel will mount before fills are rendered to the list view
	// slot. This means the list view tab isn't initially included in the
	// available tabs so the panel defaults selection to the settings tab
	// which at the time is the first tab. This check allows blocks known to
	// include the list view tab to set it as the tab selected by default.
	const initialTabName = ! useIsListViewTabDisabled( blockName )
		? TAB_LIST_VIEW.name
		: undefined;

	return (
		<div className="block-editor-block-inspector__tabs">
			<Tabs defaultTabId={ initialTabName } key={ clientId }>
				<Tabs.TabList>
					{ tabs.map( ( tab ) =>
						showIconLabels ? (
							<Tabs.Tab key={ tab.name } tabId={ tab.name }>
								{ tab.title }
							</Tabs.Tab>
						) : (
							<Tooltip text={ tab.title } key={ tab.name }>
								<Tabs.Tab
									tabId={ tab.name }
									aria-label={ tab.title }
								>
									<Icon icon={ tab.icon } />
								</Tabs.Tab>
							</Tooltip>
						)
					) }
				</Tabs.TabList>
				<Tabs.TabPanel tabId={ TAB_SETTINGS.name } focusable={ false }>
					<SettingsTab showAdvancedControls={ !! blockName } />
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId={ TAB_STYLES.name } focusable={ false }>
					<StylesTab
						blockName={ blockName }
						clientId={ clientId }
						hasBlockStyles={ hasBlockStyles }
					/>
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId={ TAB_LIST_VIEW.name } focusable={ false }>
					<InspectorControls.Slot group="list" />
				</Tabs.TabPanel>
			</Tabs>
		</div>
	);
}
