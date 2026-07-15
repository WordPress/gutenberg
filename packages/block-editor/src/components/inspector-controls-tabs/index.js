/**
 * WordPress dependencies
 */
import {
	Icon as WCIcon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useEffect, useState, useRef } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';

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
	useEffect( () => {
		selectedTabIdRef.current = selectedTabId;
	}, [ selectedTabId ] );

	const hasListViewTab = tabs.some(
		( tab ) => tab.name === TAB_LIST_VIEW.name
	);

	// Track the selection to auto-switch between the Content and List View
	// tabs:
	//   - selectedContentBlockId: the selected block when it is a direct
	//     content item (may reset back to the Content tab).
	//   - listChildClientId / listChildParentId: the selected block and its
	//     list-view-enabled content ancestor when the selection sits inside
	//     one (switches to the List View tab).
	const { selectedContentBlockId, listChildClientId, listChildParentId } =
		useSelect(
			( select ) => {
				if ( ! isSectionBlock ) {
					return {
						selectedContentBlockId: null,
						listChildClientId: null,
						listChildParentId: null,
					};
				}
				const store = select( blockEditorStore );
				const selectedId = store.getSelectedBlockClientId();
				const childParentId =
					unlock( store ).getListViewChildParentId(
						contentClientIds
					);
				return {
					selectedContentBlockId:
						selectedId && contentClientIds?.includes( selectedId )
							? selectedId
							: null,
					listChildClientId: childParentId ? selectedId : null,
					listChildParentId: childParentId,
				};
			},
			[ isSectionBlock, contentClientIds ]
		);

	// When a content block is selected while on List View, reset to the
	// Content tab — unless the List View was opened programmatically for that
	// same block (switchToListView or requestInspectorTab record the block
	// they opened it for below). The marker only lives until the next
	// selection change, so it cannot suppress a reset for any other block.
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
		// Leave panel state alone when the ancestor's panel is already open:
		// re-opening would close every other panel and remount the ListView,
		// dropping focus when the selection came from within it.
		if (
			! unlock(
				registry.select( blockEditorStore )
			).isListViewPanelOpened( listChildParentId )
		) {
			setOpenListViewPanel( listChildParentId );
			incrementListViewExpandRevision();
		}
		setSelectedTabId( TAB_LIST_VIEW.name );
		// Keep the auto-selected tab sticky: without this the auto-select
		// effect below would treat the tab as unset and jump back to the
		// first tab.
		hasUserSelectionRef.current = true;
	}, [
		listChildClientId,
		listChildParentId,
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
			// Record which block's List View was opened on purpose so the
			// content-reset effect does not undo this switch.
			programmaticListViewClientIdRef.current =
				requestedTab.options?.openPanel ?? selectedContentBlockId;
		}

		// Flag as programmatic so handleTabSelect skips the setAllListViewPanelsOpen
		// call — requestedTab already specified the exact panel to open.
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
			// Record which block's List View was opened on purpose so the
			// content-reset effect does not immediately undo this.
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
