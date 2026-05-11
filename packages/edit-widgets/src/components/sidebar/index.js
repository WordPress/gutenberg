/**
 * WordPress dependencies
 */
import {
	useEffect,
	Platform,
	useContext,
	useCallback,
} from '@wordpress/element';
import { isRTL, __ } from '@wordpress/i18n';
import {
	ComplementaryArea,
	store as interfaceStore,
} from '@wordpress/interface';
import {
	BlockInspector,
	store as blockEditorStore,
} from '@wordpress/block-editor';

import { drawerLeft, drawerRight } from '@wordpress/icons';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );

const BLOCK_INSPECTOR_IDENTIFIER = 'edit-widgets/block-inspector';

// Widget areas were once called block areas, so use 'edit-widgets/block-areas'
// for backwards compatibility.
const WIDGET_AREAS_IDENTIFIER = 'edit-widgets/block-areas';

/**
 * Internal dependencies
 */
import WidgetAreas from './widget-areas';
import { store as editWidgetsStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

function SidebarHeader( { selectedWidgetAreaBlock } ) {
	return (
		<Tabs.TabList>
			<Tabs.Tab tabId={ WIDGET_AREAS_IDENTIFIER }>
				{ selectedWidgetAreaBlock
					? selectedWidgetAreaBlock.attributes.name
					: __( 'Widget Areas' ) }
			</Tabs.Tab>
			<Tabs.Tab tabId={ BLOCK_INSPECTOR_IDENTIFIER }>
				{ __( 'Block' ) }
			</Tabs.Tab>
		</Tabs.TabList>
	);
}

function SidebarContent( {
	hasSelectedNonAreaBlock,
	currentArea,
	isGeneralSidebarOpen,
	selectedWidgetAreaBlock,
} ) {
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	useEffect( () => {
		if (
			hasSelectedNonAreaBlock &&
			currentArea === WIDGET_AREAS_IDENTIFIER &&
			isGeneralSidebarOpen
		) {
			enableComplementaryArea(
				'core/edit-widgets',
				BLOCK_INSPECTOR_IDENTIFIER
			);
		}
		if (
			! hasSelectedNonAreaBlock &&
			currentArea === BLOCK_INSPECTOR_IDENTIFIER &&
			isGeneralSidebarOpen
		) {
			enableComplementaryArea(
				'core/edit-widgets',
				WIDGET_AREAS_IDENTIFIER
			);
		}
		// We're intentionally leaving `currentArea` and `isGeneralSidebarOpen`
		// out of the dep array because we want this effect to run based on
		// block selection changes, not sidebar state changes.
	}, [ hasSelectedNonAreaBlock, enableComplementaryArea ] );

	const tabsContextValue = useContext( Tabs.Context );

	return (
		<ComplementaryArea
			className="edit-widgets-sidebar"
			header={
				<Tabs.Context.Provider value={ tabsContextValue }>
					<SidebarHeader
						selectedWidgetAreaBlock={ selectedWidgetAreaBlock }
					/>
				</Tabs.Context.Provider>
			}
			headerClassName="edit-widgets-sidebar__panel-tabs"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Settings' ) }
			closeLabel={ __( 'Close Settings' ) }
			scope="core/edit-widgets"
			identifier={ currentArea }
			icon={ isRTL() ? drawerLeft : drawerRight }
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
		>
			<Tabs.Context.Provider value={ tabsContextValue }>
				<Tabs.TabPanel
					tabId={ WIDGET_AREAS_IDENTIFIER }
					focusable={ false }
				>
					<WidgetAreas
						selectedWidgetAreaId={
							selectedWidgetAreaBlock?.attributes.id
						}
					/>
				</Tabs.TabPanel>
				<Tabs.TabPanel
					tabId={ BLOCK_INSPECTOR_IDENTIFIER }
					focusable={ false }
				>
					{ hasSelectedNonAreaBlock ? (
						<BlockInspector />
					) : (
						// Pretend that Widget Areas are part of the UI by not
						// showing the Block Inspector when one is selected.
						<span className="block-editor-block-inspector__no-blocks">
							{ __( 'No block selected.' ) }
						</span>
					) }
				</Tabs.TabPanel>
			</Tabs.Context.Provider>
		</ComplementaryArea>
	);
}

export default function Sidebar() {
	const {
		currentArea,
		hasSelectedNonAreaBlock,
		isGeneralSidebarOpen,
		selectedWidgetAreaBlock,
	} = useSelect( ( select ) => {
		const { getSelectedBlock, getBlock, getBlockParentsByBlockName } =
			select( blockEditorStore );
		const { getActiveComplementaryArea } = select( interfaceStore );

		const selectedBlock = getSelectedBlock();

		const activeArea = getActiveComplementaryArea( editWidgetsStore.name );

		let currentSelection = activeArea;
		if ( ! currentSelection ) {
			if ( selectedBlock ) {
				currentSelection = BLOCK_INSPECTOR_IDENTIFIER;
			} else {
				currentSelection = WIDGET_AREAS_IDENTIFIER;
			}
		}

		let widgetAreaBlock;
		if ( selectedBlock ) {
			if ( selectedBlock.name === 'core/widget-area' ) {
				widgetAreaBlock = selectedBlock;
			} else {
				widgetAreaBlock = getBlock(
					getBlockParentsByBlockName(
						selectedBlock.clientId,
						'core/widget-area'
					)[ 0 ]
				);
			}
		}

		return {
			currentArea: currentSelection,
			hasSelectedNonAreaBlock: !! (
				selectedBlock && selectedBlock.name !== 'core/widget-area'
			),
			isGeneralSidebarOpen: !! activeArea,
			selectedWidgetAreaBlock: widgetAreaBlock,
		};
	}, [] );

	const { enableComplementaryArea } = useDispatch( interfaceStore );

	// `newSelectedTabId` could technically be falsy if no tab is selected (i.e.
	// the initial render) or when we don't want a tab displayed (i.e. the
	// sidebar is closed). These cases should both be covered by the `!!` check
	// below, so we shouldn't need any additional falsy handling.
	const onTabSelect = useCallback(
		( newSelectedTabId ) => {
			if ( !! newSelectedTabId ) {
				enableComplementaryArea(
					editWidgetsStore.name,
					newSelectedTabId
				);
			}
		},
		[ enableComplementaryArea ]
	);

	return (
		<Tabs
			// Due to how this component is controlled (via a value from the
			// `interfaceStore`), when the sidebar closes the currently selected
			// tab can't be found. This causes the component to continuously reset
			// the selection to `null` in an infinite loop. Proactively setting
			// the selected tab to `null` avoids that.
			selectedTabId={ isGeneralSidebarOpen ? currentArea : null }
			onSelect={ onTabSelect }
			selectOnMove={ false }
		>
			<SidebarContent
				hasSelectedNonAreaBlock={ hasSelectedNonAreaBlock }
				currentArea={ currentArea }
				isGeneralSidebarOpen={ isGeneralSidebarOpen }
				selectedWidgetAreaBlock={ selectedWidgetAreaBlock }
			/>
		</Tabs>
	);
}
