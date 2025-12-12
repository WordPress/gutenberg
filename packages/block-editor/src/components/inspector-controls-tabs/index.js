/**
 * WordPress dependencies
 */
import {
	Icon,
	Tooltip,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { TAB_SETTINGS, TAB_STYLES, TAB_LIST_VIEW, TAB_CONTENT } from './utils';
import SettingsTab from './settings-tab';
import StylesTab from './styles-tab';
import ContentTab from './content-tab';
import InspectorControls from '../inspector-controls';
import useIsListViewTabDisabled from './use-is-list-view-tab-disabled';
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

export default function InspectorControlsTabs( {
	blockName,
	clientId,
	hasBlockStyles,
	tabs,
	isSectionBlock,
	contentClientIds,
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

	const [ selectedTabId, setSelectedTabId ] = useState(
		initialTabName ?? tabs[ 0 ]?.name
	);

	// When the active tab is not amongst the available `tabs`, it indicates
	// the list of tabs was changed dynamically with the active one being
	// removed. Set the active tab back to the first tab.
	useEffect( () => {
		// Skip this behavior if `initialTabName` is supplied. In the navigation
		// block, the list view tab isn't present in `tabs` initially. The early
		// return here prevents the dynamic behavior that follows from overriding
		// `initialTabName`.
		if ( initialTabName ) {
			return;
		}

		if ( tabs?.length && selectedTabId ) {
			const activeTab = tabs.find(
				( tab ) => tab.name === selectedTabId
			);
			if ( ! activeTab ) {
				setSelectedTabId( tabs[ 0 ].name );
			}
		}
	}, [ tabs, selectedTabId, initialTabName ] );

	return (
		<div className="block-editor-block-inspector__tabs">
			<Tabs
				defaultTabId={ initialTabName }
				selectedTabId={ selectedTabId }
				onSelect={ setSelectedTabId }
				key={ clientId }
			>
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
						isSectionBlock={ isSectionBlock }
						contentClientIds={ contentClientIds }
					/>
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId={ TAB_CONTENT.name } focusable={ false }>
					<ContentTab
						rootClientId={ clientId }
						contentClientIds={ contentClientIds }
					/>
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId={ TAB_LIST_VIEW.name } focusable={ false }>
					<InspectorControls.Slot group="list" />
				</Tabs.TabPanel>
			</Tabs>
		</div>
	);
}
