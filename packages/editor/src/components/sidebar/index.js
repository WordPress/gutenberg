/**
 * WordPress dependencies
 */
import {
	BlockInspector,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Platform,
	useCallback,
	useContext,
	useEffect,
	useRef,
} from '@wordpress/element';
import { isRTL, __ } from '@wordpress/i18n';
import { drawerLeft, drawerRight } from '@wordpress/icons';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import PatternOverridesPanel from '../pattern-overrides-panel';
import PluginDocumentSettingPanel from '../plugin-document-setting-panel';
import PluginSidebar from '../plugin-sidebar';
import PostSummary from './post-summary';
import PostTaxonomiesPanel from '../post-taxonomies/panel';
import PostTransformPanel from '../post-transform-panel';
import SidebarHeader from './header';
import TemplateContentPanel from '../template-content-panel';
import TemplatePartContentPanel from '../template-part-content-panel';
import useAutoSwitchEditorSidebars from '../provider/use-auto-switch-editor-sidebars';
import { sidebars } from './constants';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import {
	NAVIGATION_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_POST_TYPE,
} from '../../store/constants';

const { Tabs } = unlock( componentsPrivateApis );

const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );

const SidebarContent = ( {
	tabName,
	keyboardShortcut,
	onActionPerformed,
	extraPanels,
} ) => {
	const tabListRef = useRef( null );
	// Because `PluginSidebar` renders a `ComplementaryArea`, we
	// need to forward the `Tabs` context so it can be passed through the
	// underlying slot/fill.
	const tabsContextValue = useContext( Tabs.Context );

	// This effect addresses a race condition caused by tabbing from the last
	// block in the editor into the settings sidebar. Without this effect, the
	// selected tab and browser focus can become separated in an unexpected way
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
		<PluginSidebar
			identifier={ tabName }
			header={
				<Tabs.Context.Provider value={ tabsContextValue }>
					<SidebarHeader ref={ tabListRef } />
				</Tabs.Context.Provider>
			}
			closeLabel={ __( 'Close Settings' ) }
			// This classname is added so we can apply a corrective negative
			// margin to the panel.
			// see https://github.com/WordPress/gutenberg/pull/55360#pullrequestreview-1737671049
			className="editor-sidebar__panel"
			headerClassName="editor-sidebar__panel-tabs"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Settings' ) }
			toggleShortcut={ keyboardShortcut }
			icon={ isRTL() ? drawerLeft : drawerRight }
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
		>
			<Tabs.Context.Provider value={ tabsContextValue }>
				<Tabs.TabPanel tabId={ sidebars.document } focusable={ false }>
					<PostSummary onActionPerformed={ onActionPerformed } />
					<PluginDocumentSettingPanel.Slot />
					<TemplateContentPanel />
					<TemplatePartContentPanel />
					<PostTransformPanel />
					<PostTaxonomiesPanel />
					<PatternOverridesPanel />
					{ extraPanels }
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId={ sidebars.block } focusable={ false }>
					<BlockInspector />
				</Tabs.TabPanel>
			</Tabs.Context.Provider>
		</PluginSidebar>
	);
};

const Sidebar = ( { extraPanels, onActionPerformed } ) => {
	useAutoSwitchEditorSidebars();
	const { tabName, keyboardShortcut, showSummary } = useSelect(
		( select ) => {
			const shortcut = select(
				keyboardShortcutsStore
			).getShortcutRepresentation( 'core/editor/toggle-sidebar' );

			const sidebar =
				select( interfaceStore ).getActiveComplementaryArea( 'core' );
			const _isEditorSidebarOpened = [
				sidebars.block,
				sidebars.document,
			].includes( sidebar );
			let _tabName = sidebar;
			if ( ! _isEditorSidebarOpened ) {
				_tabName = !! select(
					blockEditorStore
				).getBlockSelectionStart()
					? sidebars.block
					: sidebars.document;
			}

			return {
				tabName: _tabName,
				keyboardShortcut: shortcut,
				showSummary: ! [
					TEMPLATE_POST_TYPE,
					TEMPLATE_PART_POST_TYPE,
					NAVIGATION_POST_TYPE,
				].includes( select( editorStore ).getCurrentPostType() ),
			};
		},
		[]
	);

	const { enableComplementaryArea } = useDispatch( interfaceStore );

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
			<SidebarContent
				tabName={ tabName }
				keyboardShortcut={ keyboardShortcut }
				showSummary={ showSummary }
				onActionPerformed={ onActionPerformed }
				extraPanels={ extraPanels }
			/>
		</Tabs>
	);
};

export default Sidebar;
