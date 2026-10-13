import {
	Icon as WCIcon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useEffect, useState, useRef } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { Tooltip } from '@wordpress/ui';
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

	// The effects below run in declaration order when React calls them as
	// part of its commit phase. Two of the effects in this component rely on
	// the ordering being correct:
	//
	// 1. `selectedTabIdRef` updates first, so the reset effect reads the
	//    current tab.
	// 2. The reset effect runs before the `requestedTab` effect, so it cannot
	//    undo a requested tab.
	const selectedTabIdRef = useRef( selectedTabId );
	useEffect( () => {
		selectedTabIdRef.current = selectedTabId;
	}, [ selectedTabId ] );

	const hasListViewTab = tabs.some(
		( tab ) => tab.name === TAB_LIST_VIEW.name
	);

	// What the current selection means for the tab:
	//   - selectedContentBlockId: a selected content item. Shows Content.
	//   - listChildClientId: a selected block inside a content item's List View
	//     panel; listViewAncestorId is that content item. Shows List View.
	const { selectedContentBlockId, listChildClientId, listViewAncestorId } =
		useSelect(
			( select ) => {
				const store = unlock( select( blockEditorStore ) );
				const selectedId = isSectionBlock
					? store.getSelectedBlockClientId()
					: null;
				const isContentItem =
					!! selectedId &&
					!! contentClientIds?.includes( selectedId );
				const ancestorId =
					selectedId && ! isContentItem
						? store.getListViewSupportAncestor( selectedId )
						: null;
				// Ignore an ancestor outside this section.
				const contentAncestorId =
					ancestorId && contentClientIds?.includes( ancestorId )
						? ancestorId
						: null;
				return {
					selectedContentBlockId: isContentItem ? selectedId : null,
					listChildClientId: contentAncestorId ? selectedId : null,
					listViewAncestorId: contentAncestorId,
				};
			},
			[ isSectionBlock, contentClientIds ]
		);

	// Selecting a content item while on List View goes back to Content, unless
	// List View was opened on purpose for that item. The marker is cleared on
	// every selection change.
	const programmaticListViewClientIdRef = useRef( null );
	useEffect( () => {
		const programmaticClientId = programmaticListViewClientIdRef.current;
		programmaticListViewClientIdRef.current = null;
		if (
			selectedContentBlockId &&
			selectedContentBlockId !== programmaticClientId &&
			selectedTabIdRef.current === TAB_LIST_VIEW.name
		) {
			setSelectedTabId( TAB_CONTENT.name );
			hasUserSelectionRef.current = false;
		}
	}, [ selectedContentBlockId ] );

	const registry = useRegistry();
	useEffect( () => {
		if ( ! listChildClientId || ! hasListViewTab ) {
			return;
		}
		// Reopening an open panel closes the others and remounts the list,
		// dropping focus.
		if (
			! unlock(
				registry.select( blockEditorStore )
			).isListViewPanelOpened( listViewAncestorId )
		) {
			setOpenListViewPanel( listViewAncestorId );
			incrementListViewExpandRevision();
		}
		setSelectedTabId( TAB_LIST_VIEW.name );
		// Stop the auto-select effect below resetting to the first tab.
		hasUserSelectionRef.current = true;
	}, [
		listChildClientId,
		listViewAncestorId,
		hasListViewTab,
		registry,
		setOpenListViewPanel,
		incrementListViewExpandRevision,
	] );

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
			// Stop the reset effect undoing this switch.
			programmaticListViewClientIdRef.current =
				requestedTab.options?.openPanel ?? selectedContentBlockId;
		}

		// Mark as handled (programmatic switch)
		isProgrammaticSwitchRef.current = true;
		hasUserSelectionRef.current = true;

		// Clear the request
		clearRequestedInspectorTab();
	}, [
		requestedTab,
		selectedContentBlockId,
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

	const switchToListView = ( targetClientId ) => {
		if ( hasListViewTab ) {
			// Open only the target panel
			setOpenListViewPanel( targetClientId );
			incrementListViewExpandRevision();
			// Mark this as a programmatic switch
			isProgrammaticSwitchRef.current = true;
			// Stop the reset effect undoing this switch.
			programmaticListViewClientIdRef.current = targetClientId;
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
