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
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import {
	PageAttributesPanel,
	PostDiscussionPanel,
	PostLastRevisionPanel,
	PostTaxonomiesPanel,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import GlobalStylesSidebar from './global-styles-sidebar';
import SettingsHeader from './settings-header';
import PagePanels from './page-panels';
import TemplatePanel from './template-panel';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );
const { interfaceStore, useAutoSwitchEditorSidebars, PatternOverridesPanel } =
	unlock( editorPrivateApis );
const { Slot: InspectorSlot, Fill: InspectorFill } = createSlotFill(
	'EditSiteSidebarInspector'
);
export const SidebarInspectorFill = InspectorFill;

const FillContents = ( { tabName, isEditingPage, supportsGlobalStyles } ) => {
	const tabListRef = useRef( null );
	// Because `DefaultSidebar` renders a `ComplementaryArea`, we
	// need to forward the `Tabs` context so it can be passed through the
	// underlying slot/fill.
	const tabsContextValue = useContext( Tabs.Context );

	// This effect addresses a race condition caused by tabbing from the last
	// block in the editor into the settings sidebar. Without this effect, the
	// selected tab and browser focus can become separated in an unexpected way.
	// (e.g the "block" tab is focused, but the "post" tab is selected).
	useEffect( () => {
		const tabsElements = Array.from(
			tabListRef.current?.querySelectorAll( '[role="tab"]' ) || []
		);
		const selectedTabElement = tabsElements.find(
			// We are purposefully using a custom `data-tab-id` attribute here
			// because we don't want rely on any assumptions about `Tabs`
			// component internals.
			( element ) => element.getAttribute( 'data-tab-id' ) === tabName
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
	}, [ tabName ] );

	return (
		<>
			<DefaultSidebar
				identifier={ tabName }
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
				isActiveByDefault
			>
				<Tabs.Context.Provider value={ tabsContextValue }>
					<Tabs.TabPanel
						tabId="edit-post/document"
						focusable={ false }
					>
						{ isEditingPage ? <PagePanels /> : <TemplatePanel /> }
						<PostLastRevisionPanel />
						<PostTaxonomiesPanel />
						<PostDiscussionPanel />
						<PageAttributesPanel />
						<PatternOverridesPanel />
					</Tabs.TabPanel>
					<Tabs.TabPanel tabId="edit-post/block" focusable={ false }>
						<InspectorSlot bubblesVirtually />
					</Tabs.TabPanel>
				</Tabs.Context.Provider>
			</DefaultSidebar>
			{ supportsGlobalStyles && <GlobalStylesSidebar /> }
		</>
	);
};

export function SidebarComplementaryAreaFills() {
	useAutoSwitchEditorSidebars();
	const { tabName, supportsGlobalStyles, isEditingPage } = useSelect(
		( select ) => {
			const sidebar =
				select( interfaceStore ).getActiveComplementaryArea( 'core' );

			const _isEditorSidebarOpened = [
				'edit-post/block',
				'edit-post/document',
			].includes( sidebar );
			let _tabName = sidebar;
			if ( ! _isEditorSidebarOpened ) {
				_tabName = !! select(
					blockEditorStore
				).getBlockSelectionStart()
					? 'edit-post/block'
					: 'edit-post/document';
			}

			return {
				tabName: _tabName,
				supportsGlobalStyles:
					select( coreStore ).getCurrentTheme()?.is_block_theme,
				isEditingPage: select( editSiteStore ).isPage(),
			};
		},
		[]
	);
	const { enableComplementaryArea } = useDispatch( interfaceStore );

	// `newSelectedTabId` could technically be falsey if no tab is selected (i.e.
	// the initial render) or when we don't want a tab displayed (i.e. the
	// sidebar is closed). These cases should both be covered by the `!!` check
	// below, so we shouldn't need any additional falsey handling.
	const onTabSelect = useCallback(
		( newSelectedTabId ) => {
			if ( !! newSelectedTabId ) {
				enableComplementaryArea( 'core', newSelectedTabId );
			}
		},
		[ enableComplementaryArea ]
	);

	return (
		<Tabs
			selectedTabId={ tabName }
			onSelect={ onTabSelect }
			selectOnMove={ false }
		>
			<FillContents
				tabName={ tabName }
				isEditingPage={ isEditingPage }
				supportsGlobalStyles={ supportsGlobalStyles }
			/>
		</Tabs>
	);
}
