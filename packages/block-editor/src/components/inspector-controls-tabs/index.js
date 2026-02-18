/**
 * WordPress dependencies
 */
import {
	Icon as WCIcon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useEffect, useState, useRef } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { useSelect, useDispatch } from '@wordpress/data';

import { Tooltip } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { TAB_SETTINGS, TAB_STYLES, TAB_LIST_VIEW, TAB_CONTENT } from './utils';
import SettingsTab from './settings-tab';
import StylesTab from './styles-tab';
import ContentTab from './content-tab';
import { ListViewContentPopover } from '../inspector-controls/list-view-content-popover';
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
	const listViewRef = useRef( null );
	const showIconLabels = useSelect( ( select ) => {
		return select( preferencesStore ).get( 'core', 'showIconLabels' );
	}, [] );

	// Get any requested inspector tab (used for initial state when programmatically switching)
	const { requestedTab } = useSelect( ( select ) => ( {
		requestedTab: unlock(
			select( blockEditorStore )
		).getRequestedInspectorTab(),
	} ) );

	const [ selectedTabId, setSelectedTabId ] = useState(
		() => requestedTab?.tabName ?? tabs[ 0 ]?.name
	);
	const hasUserSelectionRef = useRef( false );
	const isProgrammaticSwitchRef = useRef( false );
	const {
		__unstableSetOpenListViewPanel: setOpenListViewPanel,
		__unstableIncrementListViewExpandRevision:
			incrementListViewExpandRevision,
		__unstableSetAllListViewPanelsOpen: setAllListViewPanelsOpen,
	} = useDispatch( blockEditorStore );
	const { clearRequestedInspectorTab } = unlock(
		useDispatch( blockEditorStore )
	);

	// Reset when switching blocks
	useEffect( () => {
		hasUserSelectionRef.current = false;
	}, [ clientId ] );

	const selectedTabIdRef = useRef( selectedTabId );
	selectedTabIdRef.current = selectedTabId;

	// Track which content block is selected to auto-switch between
	// Content and List View tabs. Returns the selected block's clientId
	// when it's a content item, or null otherwise.
	const selectedContentBlockId = useSelect(
		( select ) => {
			if ( ! isSectionBlock ) {
				return null;
			}
			const selectedId =
				select( blockEditorStore ).getSelectedBlockClientId();
			if ( ! selectedId || ! contentClientIds?.includes( selectedId ) ) {
				return null;
			}
			return selectedId;
		},
		[ isSectionBlock, contentClientIds ]
	);

	// When a content block is selected while on List View, reset to
	// Content tab. skipNextContentResetRef prevents this from firing
	// when switchToListView or requestInspectorTab intentionally
	// opened List View for that same block.
	const skipNextContentResetRef = useRef( false );
	const prevSelectedContentBlockRef = useRef( selectedContentBlockId );
	useEffect( () => {
		const prev = prevSelectedContentBlockRef.current;
		prevSelectedContentBlockRef.current = selectedContentBlockId;

		if ( selectedContentBlockId === prev ) {
			return;
		}

		if (
			selectedContentBlockId &&
			selectedTabIdRef.current === TAB_LIST_VIEW.name &&
			! skipNextContentResetRef.current
		) {
			setSelectedTabId( TAB_CONTENT.name );
			hasUserSelectionRef.current = false;
		}

		skipNextContentResetRef.current = false;
	}, [ selectedContentBlockId ] );

	// Handle explicit inspector tab requests (panel opening, refs, clear).
	// Tab state is initialized from requestedTab above.
	useEffect( () => {
		if ( ! requestedTab ) {
			return;
		}

		// Switch to the requested tab
		setSelectedTabId( requestedTab.tabName );

		// Handle tab-specific options
		if ( requestedTab.tabName === TAB_LIST_VIEW.name ) {
			if ( requestedTab.options?.openPanel ) {
				// Open the specific panel for List View
				setOpenListViewPanel( requestedTab.options.openPanel );
				incrementListViewExpandRevision();
			}
			// Prevent the content-reset effect from undoing this switch.
			skipNextContentResetRef.current = true;
		}

		// Mark as handled (programmatic switch)
		isProgrammaticSwitchRef.current = true;
		hasUserSelectionRef.current = true;

		// Clear the request
		clearRequestedInspectorTab();
	}, [
		requestedTab,
		setOpenListViewPanel,
		incrementListViewExpandRevision,
		clearRequestedInspectorTab,
	] );

	// Initialize List View panels when the tab is selected and clientId changes
	useEffect( () => {
		if (
			selectedTabId === TAB_LIST_VIEW.name &&
			! hasUserSelectionRef.current
		) {
			setAllListViewPanelsOpen();
			incrementListViewExpandRevision();
		}
	}, [
		clientId,
		selectedTabId,
		setAllListViewPanelsOpen,
		incrementListViewExpandRevision,
	] );

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

		// If manually switching to List View tab (not via click-through), open all panels
		if (
			tabId === TAB_LIST_VIEW.name &&
			! isProgrammaticSwitchRef.current
		) {
			setAllListViewPanelsOpen();
			incrementListViewExpandRevision();
		}

		// Reset the flag
		isProgrammaticSwitchRef.current = false;
	};

	const hasListViewTab = tabs.some(
		( tab ) => tab.name === TAB_LIST_VIEW.name
	);

	const switchToListView = ( targetClientId ) => {
		if ( hasListViewTab ) {
			// Open only the target panel
			setOpenListViewPanel( targetClientId );
			incrementListViewExpandRevision();
			// Mark this as a programmatic switch
			isProgrammaticSwitchRef.current = true;
			// Prevent the content-reset effect from immediately undoing this.
			skipNextContentResetRef.current = true;
			handleTabSelect( TAB_LIST_VIEW.name );
		}
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
							<Tooltip.Root key={ tab.name }>
								<Tabs.Tab
									tabId={ tab.name }
									aria-label={ tab.title }
									render={ <Tooltip.Trigger /> }
								>
									<WCIcon icon={ tab.icon } />
								</Tabs.Tab>
								<Tooltip.Popup>{ tab.title }</Tooltip.Popup>
							</Tooltip.Root>
						)
					) }
				</Tabs.TabList>
				<Tabs.TabPanel tabId={ TAB_CONTENT.name } focusable={ false }>
					<ContentTab
						contentClientIds={ contentClientIds }
						onSwitchToListView={ switchToListView }
						hasListViewTab={ hasListViewTab }
					/>
					<InspectorControls.Slot group="content" />
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId={ TAB_LIST_VIEW.name } focusable={ false }>
					<InspectorControls.Slot group="list" ref={ listViewRef } />
					<ListViewContentPopover listViewRef={ listViewRef } />
				</Tabs.TabPanel>
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
			</Tabs>
		</div>
	);
}
