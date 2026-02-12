/**
 * WordPress dependencies
 */
import {
	Icon,
	Tooltip,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
	useRef,
} from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { useSelect, useDispatch } from '@wordpress/data';

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

	// Get the actual selected block name and clientId to detect when navigation block is selected via "Edit Navigation" button
	const { selectedBlockName, selectedBlockClientId } = useSelect(
		( select ) => {
			const { getSelectedBlockClientId, getBlockName } =
				select( blockEditorStore );
			const selectedClientId = getSelectedBlockClientId();
			return {
				selectedBlockName: selectedClientId
					? getBlockName( selectedClientId )
					: null,
				selectedBlockClientId: selectedClientId,
			};
		},
		[]
	);

	const [ selectedTabId, setSelectedTabId ] = useState( tabs[ 0 ]?.name );
	const hasUserSelectionRef = useRef( false );
	const isProgrammaticSwitchRef = useRef( false );
	const {
		__unstableSetOpenListViewPanel: setOpenListViewPanel,
		__unstableIncrementListViewExpandRevision:
			incrementListViewExpandRevision,
		__unstableSetAllListViewPanelsOpen: setAllListViewPanelsOpen,
	} = useDispatch( blockEditorStore );

	const hasListViewTab = tabs.some(
		( tab ) => tab.name === TAB_LIST_VIEW.name
	);

	// Check if we should show List View tab for navigation block (Edit Navigation context)
	const shouldShowListViewForNavigation = useMemo( () => {
		return (
			selectedBlockName === 'core/navigation' &&
			contentClientIds?.length > 0 &&
			hasListViewTab
		);
	}, [ selectedBlockName, contentClientIds, hasListViewTab ] );

	// Reset when switching blocks
	useEffect( () => {
		hasUserSelectionRef.current = false;
	}, [ clientId ] );

	// Switch to List View tab synchronously before paint when navigation block is selected
	// This prevents the flash of Content tab showing the navigation block
	useLayoutEffect( () => {
		if ( ! tabs?.length ) {
			return;
		}

		if (
			shouldShowListViewForNavigation &&
			selectedTabId !== TAB_LIST_VIEW.name
		) {
			setSelectedTabId( TAB_LIST_VIEW.name );
			// Open the navigation block's accordion in List View
			if ( selectedBlockClientId ) {
				setOpenListViewPanel( selectedBlockClientId );
				incrementListViewExpandRevision();
				isProgrammaticSwitchRef.current = true;
			}
		}
	}, [
		tabs,
		selectedTabId,
		shouldShowListViewForNavigation,
		selectedBlockClientId,
		setOpenListViewPanel,
		incrementListViewExpandRevision,
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

		// Skip if we already handled navigation block in useLayoutEffect
		if ( shouldShowListViewForNavigation ) {
			return;
		}

		const defaultTabName = tabs[ 0 ]?.name;
		if ( selectedTabId !== defaultTabName ) {
			setSelectedTabId( defaultTabName );
		}
	}, [ tabs, selectedTabId, shouldShowListViewForNavigation ] );

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
