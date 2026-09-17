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

	const {
		__unstableSetOpenListViewPanel: setOpenListViewPanel,
		__unstableIncrementListViewExpandRevision:
			incrementListViewExpandRevision,
		__unstableSetAllListViewPanelsOpen: setAllListViewPanelsOpen,
	} = useDispatch( blockEditorStore );
	const { clearRequestedInspectorTab } = unlock(
		useDispatch( blockEditorStore )
	);

	const hasListViewTab = tabs.some(
		( tab ) => tab.name === TAB_LIST_VIEW.name
	);

	// Everything the tab choice depends on, read in one pass:
	//   - selectedBlockClientId: identifies the current selection, and so how
	//     long an override below stays valid.
	//   - selectedContentBlockId: set when the selection is a direct content
	//     item, which suggests the Content tab.
	//   - listChildParentId: the list-view-enabled content ancestor when the
	//     selection sits inside one, which suggests the List View tab.
	//   - requestedTab: an explicit request from elsewhere in the editor.
	const {
		selectedBlockClientId,
		selectedContentBlockId,
		listChildParentId,
		requestedTab,
	} = useSelect(
		( select ) => {
			const store = select( blockEditorStore );
			const selectedId = store.getSelectedBlockClientId();
			const privateStore = unlock( store );
			return {
				selectedBlockClientId: selectedId,
				requestedTab: privateStore.getRequestedInspectorTab(),
				selectedContentBlockId:
					isSectionBlock &&
					selectedId &&
					contentClientIds?.includes( selectedId )
						? selectedId
						: null,
				listChildParentId: isSectionBlock
					? privateStore.getListViewChildParentId( contentClientIds )
					: null,
			};
		},
		[ isSectionBlock, contentClientIds ]
	);

	// A tab the user picked, or that something else asked for, along with the
	// block it was chosen for. It outranks the suggestion below until the
	// selection moves to a different block.
	//
	// `forClientId` is the block the choice belongs to rather than the block
	// selected when it was made, so a request that arrives just before its
	// selection (as "Edit navigation" does) survives that selection landing.
	const [ override, setOverride ] = useState( null );

	// Drop a stale override during render rather than in an effect, so the
	// tab never renders once with the outgoing value.
	const [ lastSelection, setLastSelection ] = useState(
		selectedBlockClientId
	);
	if ( lastSelection !== selectedBlockClientId ) {
		setLastSelection( selectedBlockClientId );
		if ( override && override.forClientId !== selectedBlockClientId ) {
			setOverride( null );
		}
	}

	// What the selection alone implies. Selecting inside a list-view content
	// block shows that block's List View; selecting a content item directly
	// shows the content list.
	let suggestedTabId = null;
	if ( listChildParentId && hasListViewTab ) {
		suggestedTabId = TAB_LIST_VIEW.name;
	} else if ( selectedContentBlockId ) {
		suggestedTabId = TAB_CONTENT.name;
	}

	const preferredTabId = override?.tabId ?? suggestedTabId ?? tabs[ 0 ]?.name;
	// Fall back whenever the preferred tab is not on offer, which also covers
	// the tab list changing underneath a choice.
	const selectedTabId = tabs.some( ( tab ) => tab.name === preferredTabId )
		? preferredTabId
		: tabs[ 0 ]?.name;

	// Open the ancestor's panel when the selection moves inside it. Skipped
	// when that panel is already open, because reopening closes every other
	// panel and remounts the ListView, dropping focus when the selection came
	// from within it.
	const registry = useRegistry();
	useEffect( () => {
		if ( ! listChildParentId || ! hasListViewTab ) {
			return;
		}
		if (
			! unlock(
				registry.select( blockEditorStore )
			).isListViewPanelOpened( listChildParentId )
		) {
			setOpenListViewPanel( listChildParentId );
			incrementListViewExpandRevision();
		}
	}, [
		selectedBlockClientId,
		listChildParentId,
		hasListViewTab,
		registry,
		setOpenListViewPanel,
		incrementListViewExpandRevision,
	] );

	// Apply an explicit request, then clear it.
	useEffect( () => {
		if ( ! requestedTab ) {
			return;
		}

		const openPanel = requestedTab.options?.openPanel;
		if ( requestedTab.tabName === TAB_LIST_VIEW.name && openPanel ) {
			setOpenListViewPanel( openPanel );
			incrementListViewExpandRevision();
		}

		setOverride( {
			tabId: requestedTab.tabName,
			forClientId: openPanel ?? selectedBlockClientId,
			// The request named the panel to open, so the List View tab must
			// not also expand everything below.
			panelChosen: !! openPanel,
		} );

		clearRequestedInspectorTab();
	}, [
		requestedTab,
		selectedBlockClientId,
		setOpenListViewPanel,
		incrementListViewExpandRevision,
		clearRequestedInspectorTab,
	] );

	// Entering List View without a particular panel in mind expands them all.
	const showingWholeListView =
		selectedTabId === TAB_LIST_VIEW.name &&
		! override?.panelChosen &&
		! listChildParentId;
	useEffect( () => {
		if ( showingWholeListView ) {
			setAllListViewPanelsOpen();
			incrementListViewExpandRevision();
		}
	}, [
		clientId,
		showingWholeListView,
		setAllListViewPanelsOpen,
		incrementListViewExpandRevision,
	] );

	const handleTabSelect = ( tabId ) => {
		setOverride( { tabId, forClientId: selectedBlockClientId } );
	};

	const switchToListView = ( targetClientId ) => {
		if ( ! hasListViewTab ) {
			return;
		}
		setOpenListViewPanel( targetClientId );
		incrementListViewExpandRevision();
		setOverride( {
			tabId: TAB_LIST_VIEW.name,
			forClientId: targetClientId,
			panelChosen: true,
		} );
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
