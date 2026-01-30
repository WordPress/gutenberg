/**
 * WordPress dependencies
 */
import {
	Icon,
	Tooltip,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useEffect, useState, useRef } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { TAB_SETTINGS, TAB_STYLES, TAB_LIST_VIEW, TAB_CONTENT } from './utils';
import SettingsTab from './settings-tab';
import StylesTab from './styles-tab';
import ContentTab from './content-tab';
import InspectorControls from '../inspector-controls';
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';

const { Tabs } = unlock( componentsPrivateApis );

export default function InspectorControlsTabs( {
	blockName,
	clientId,
	hasBlockStyles,
	tabs,
	isSectionBlock,
	contentClientIds,
} ) {
	const { showIconLabels, blockAttributeGroup } = useSelect( ( select ) => {
		const { getBlockAttributeGroup } = unlock( select( blockEditorStore ) );
		return {
			showIconLabels: select( preferencesStore ).get(
				'core',
				'showIconLabels'
			),
			blockAttributeGroup: getBlockAttributeGroup(),
		};
	}, [] );

	const { showBlockAttributeGroup } = unlock(
		useDispatch( blockEditorStore )
	);

	const [ selectedTabId, setSelectedTabId ] = useState( tabs[ 0 ]?.name );
	const hasUserSelectionRef = useRef( false );

	// Reset when switching blocks
	useEffect( () => {
		hasUserSelectionRef.current = false;
		// Clear any programmatic tab selection when switching blocks.
		showBlockAttributeGroup( null );
	}, [ clientId, showBlockAttributeGroup ] );

	// Handle programmatic tab selection from the store.
	useEffect( () => {
		if (
			blockAttributeGroup &&
			tabs.some( ( tab ) => tab.name === blockAttributeGroup )
		) {
			setSelectedTabId( blockAttributeGroup );
			// Clear the store value after applying it.
			showBlockAttributeGroup( null );
		}
	}, [ blockAttributeGroup, tabs, showBlockAttributeGroup ] );

	// Auto-select first available tab unless user has made a selection
	useEffect( () => {
		if (
			! tabs?.length ||
			( hasUserSelectionRef.current &&
				tabs.some( ( tab ) => tab.name === selectedTabId ) )
		) {
			return;
		}

		const firstTabName = tabs[ 0 ]?.name;
		if ( selectedTabId !== firstTabName ) {
			setSelectedTabId( firstTabName );
		}
	}, [ tabs, selectedTabId ] );

	const handleTabSelect = ( tabId ) => {
		setSelectedTabId( tabId );
		hasUserSelectionRef.current = true;
	};

	return (
		<div className="block-editor-block-inspector__tabs">
			<Tabs
				selectedTabId={ selectedTabId }
				onSelect={ handleTabSelect }
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
					<ContentTab contentClientIds={ contentClientIds } />
					<InspectorControls.Slot group="content" />
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId={ TAB_LIST_VIEW.name } focusable={ false }>
					<InspectorControls.Slot group="list" />
				</Tabs.TabPanel>
			</Tabs>
		</div>
	);
}
