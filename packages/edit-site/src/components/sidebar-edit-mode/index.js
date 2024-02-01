/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { drawerLeft, drawerRight } from '@wordpress/icons';
import { useCallback, useContext, useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import GlobalStylesSidebar from './global-styles-sidebar';
import { STORE_NAME } from '../../store/constants';
import SettingsHeader from './settings-header';
import PagePanels from './page-panels';
import TemplatePanel from './template-panel';
import PluginTemplateSettingPanel from '../plugin-template-setting-panel';
import { SIDEBAR_BLOCK, SIDEBAR_TEMPLATE } from './constants';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

const { Slot: InspectorSlot, Fill: InspectorFill } = createSlotFill(
	'EditSiteSidebarInspector'
);
export const SidebarInspectorFill = InspectorFill;

const FillContents = ( {
	sidebarName,
	isEditingPage,
	supportsGlobalStyles,
} ) => {
	const tabListRef = useRef( null );
	// Because `DefaultSidebar` renders a `ComplementaryArea`, we
	// need to forward the `Tabs` context so it can be passed through the
	// underlying slot/fill.
	const tabsContextValue = useContext( Tabs.Context );

	// This effect addresses a race condition caused by tabbing from the last
	// block in the editor into the settings sidebar. Without this effect, the
	// selected tab and browser focus can become separated in an unexpected way.
	useEffect( () => {
		const tabsElements = Array.from(
			tabListRef.current?.querySelectorAll( '[role="tab"]' ) || []
		);
		const selectedTabElement = tabsElements.find(
			// We are purposefully using a custom `data-tab-id` attribute here
			// because we don't want rely on any assumptions about `Tabs`
			// component internals.
			( element ) => element.getAttribute( 'data-tab-id' ) === sidebarName
		);
		const activeElement = selectedTabElement?.ownerDocument.activeElement;
		const tabsHasFocus = tabsElements.some( ( element ) => {
			return activeElement && activeElement.id === element.id;
		} );
		if (
			tabsHasFocus &&
			selectedTabElement &&
			selectedTabElement.id !== activeElement?.id
		) {
			selectedTabElement?.focus();
		}
	}, [ sidebarName ] );

	return (
		<>
			<DefaultSidebar
				identifier={ sidebarName }
				title={ __( 'Settings' ) }
				icon={ isRTL() ? drawerLeft : drawerRight }
				closeLabel={ __( 'Close Settings' ) }
				header={
					<Tabs.Context.Provider value={ tabsContextValue }>
						<SettingsHeader ref={ tabListRef } />
					</Tabs.Context.Provider>
				}
				headerClassName="edit-site-sidebar-edit-mode__panel-tabs"
				// This classname is added so we can apply a corrective negative
				// margin to the panel.
				// see https://github.com/WordPress/gutenberg/pull/55360#pullrequestreview-1737671049
				className="edit-site-sidebar__panel"
			>
				<Tabs.Context.Provider value={ tabsContextValue }>
					<Tabs.TabPanel
						tabId={ SIDEBAR_TEMPLATE }
						focusable={ false }
					>
						{ isEditingPage ? <PagePanels /> : <TemplatePanel /> }
						<PluginTemplateSettingPanel.Slot />
					</Tabs.TabPanel>
					<Tabs.TabPanel tabId={ SIDEBAR_BLOCK } focusable={ false }>
						<InspectorSlot bubblesVirtually />
					</Tabs.TabPanel>
				</Tabs.Context.Provider>
			</DefaultSidebar>
			{ supportsGlobalStyles && <GlobalStylesSidebar /> }
		</>
	);
};

export function SidebarComplementaryAreaFills() {
	const {
		sidebar,
		isEditorSidebarOpened,
		hasBlockSelection,
		supportsGlobalStyles,
		isEditingPage,
		isEditorOpen,
	} = useSelect( ( select ) => {
		const _sidebar =
			select( interfaceStore ).getActiveComplementaryArea( STORE_NAME );

		const _isEditorSidebarOpened = [
			SIDEBAR_BLOCK,
			SIDEBAR_TEMPLATE,
		].includes( _sidebar );
		const { getCanvasMode } = unlock( select( editSiteStore ) );

		return {
			sidebar: _sidebar,
			isEditorSidebarOpened: _isEditorSidebarOpened,
			hasBlockSelection:
				!! select( blockEditorStore ).getBlockSelectionStart(),
			supportsGlobalStyles:
				select( coreStore ).getCurrentTheme()?.is_block_theme,
			isEditingPage: select( editSiteStore ).isPage(),
			isEditorOpen: getCanvasMode() === 'edit',
		};
	}, [] );
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	useEffect( () => {
		// Don't automatically switch tab when the sidebar is closed or when we
		// are focused on page content.
		if ( ! isEditorSidebarOpened ) {
			return;
		}
		if ( hasBlockSelection ) {
			if ( ! isEditingPage ) {
				enableComplementaryArea( STORE_NAME, SIDEBAR_BLOCK );
			}
		} else {
			enableComplementaryArea( STORE_NAME, SIDEBAR_TEMPLATE );
		}
	}, [
		hasBlockSelection,
		isEditorSidebarOpened,
		isEditingPage,
		enableComplementaryArea,
	] );

	let sidebarName = sidebar;
	if ( ! isEditorSidebarOpened ) {
		sidebarName = hasBlockSelection ? SIDEBAR_BLOCK : SIDEBAR_TEMPLATE;
	}

	const onTabSelect = useCallback(
		( newSelectedTabId ) => {
			enableComplementaryArea( STORE_NAME, newSelectedTabId );
		},
		[ enableComplementaryArea ]
	);

	return (
		<Tabs
			// Due to how this component is controlled (via a value from the
			// edit-site store), when the sidebar closes the currently selected
			// tab can't be found. This causes the component to continuously reset
			// the selection to `null` in an infinite loop. Proactively setting
			// the selected tab to `null` avoids that.
			selectedTabId={
				isEditorOpen && isEditorSidebarOpened ? sidebarName : null
			}
			onSelect={ onTabSelect }
			selectOnMove={ false }
		>
			<FillContents
				sidebarName={ sidebarName }
				isEditingPage={ isEditingPage }
				supportsGlobalStyles={ supportsGlobalStyles }
			/>
		</Tabs>
	);
}
