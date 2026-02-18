/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
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

	const selectedTabIdRef = useRef( selectedTabId );
	selectedTabIdRef.current = selectedTabId;

	// Reset when switching to a different block context.
	const prevClientIdRef = useRef( clientId );
	useEffect( () => {
		hasUserSelectionRef.current = false;
		// When the rendered block changes, the List View content from
		// the previous block is no longer relevant. Switch back to Content.
		// Explicit requestInspectorTab requests (e.g. "Edit navigation")
		// will override this in a subsequent effect.
		if (
			prevClientIdRef.current !== clientId &&
			selectedTabIdRef.current === TAB_LIST_VIEW.name
		) {
			setSelectedTabId( TAB_CONTENT.name );
		}
		prevClientIdRef.current = clientId;
	}, [ clientId ] );

	// When a content list item is selected that doesn't navigate to List View
	// (e.g. a Heading), switch back to the Content tab from List View.
	// This prevents the tab from staying stuck on List View after clicking
	// a list-view-enabled block (e.g. Button) and then selecting a different block.
	const shouldResetToContentTab = useSelect(
		( select ) => {
			if ( ! isSectionBlock ) {
				return false;
			}
			const { getSelectedBlockClientId, getBlockName, getBlockCount } =
				select( blockEditorStore );
			const selectedId = getSelectedBlockClientId();
			if ( ! selectedId || ! contentClientIds?.includes( selectedId ) ) {
				return false;
			}
			const name = getBlockName( selectedId );
			const hasListView =
				name === 'core/navigation' ||
				hasBlockSupport( name, 'listView' );
			const hasChildren = getBlockCount( selectedId ) > 0;
			return ! ( hasListView && hasChildren );
		},
		[ isSectionBlock, contentClientIds ]
	);

	const prevShouldResetRef = useRef( shouldResetToContentTab );
	useEffect( () => {
		// Only act when shouldResetToContentTab transitions from false to true
		// (i.e. the user selected a non-list-view content item).
		// Reading selectedTabId via ref avoids triggering on manual tab switches.
		if (
			shouldResetToContentTab &&
			! prevShouldResetRef.current &&
			selectedTabIdRef.current === TAB_LIST_VIEW.name
		) {
			setSelectedTabId( TAB_CONTENT.name );
			hasUserSelectionRef.current = false;
		}
		prevShouldResetRef.current = shouldResetToContentTab;
	}, [ shouldResetToContentTab ] );

	// Handle explicit inspector tab requests (panel opening, refs, clear).
	// Tab state is initialized from requestedTab above.
	useEffect( () => {
		if ( ! requestedTab ) {
			return;
		}

		// Switch to the requested tab
		setSelectedTabId( requestedTab.tabName );

		// Handle tab-specific options
		if (
			requestedTab.tabName === TAB_LIST_VIEW.name &&
			requestedTab.options?.openPanel
		) {
			// Open the specific panel for List View
			setOpenListViewPanel( requestedTab.options.openPanel );
			incrementListViewExpandRevision();
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
