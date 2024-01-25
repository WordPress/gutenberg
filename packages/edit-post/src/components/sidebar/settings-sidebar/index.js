/**
 * WordPress dependencies
 */
import {
	BlockInspector,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { Platform, useCallback, useContext } from '@wordpress/element';
import { isRTL, __ } from '@wordpress/i18n';
import { drawerLeft, drawerRight } from '@wordpress/icons';
import { store as interfaceStore } from '@wordpress/interface';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import {
	store as editorStore,
	PageAttributesPanel,
	PostDiscussionPanel,
	PostExcerptPanel,
	PostFeaturedImagePanel,
	PostLastRevisionPanel,
	PostTaxonomiesPanel,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import SettingsHeader from '../settings-header';
import PostStatus from '../post-status';
import MetaBoxes from '../../meta-boxes';
import PluginDocumentSettingPanel from '../plugin-document-setting-panel';
import PluginSidebarEditPost from '../plugin-sidebar';
import TemplateSummary from '../template-summary';
import { store as editPostStore } from '../../../store';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { unlock } from '../../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );
export const sidebars = {
	document: 'edit-post/document',
	block: 'edit-post/block',
};

const SidebarContent = ( {
	sidebarName,
	keyboardShortcut,
	isEditingTemplate,
} ) => {
	// Because `PluginSidebarEditPost` renders a `ComplementaryArea`, we
	// need to forward the `Tabs` context so it can be passed through the
	// underlying slot/fill.
	const tabsContextValue = useContext( Tabs.Context );

	return (
		<PluginSidebarEditPost
			identifier={ sidebarName }
			header={
				<Tabs.Context.Provider value={ tabsContextValue }>
					<SettingsHeader />
				</Tabs.Context.Provider>
			}
			closeLabel={ __( 'Close Settings' ) }
			// This classname is added so we can apply a corrective negative
			// margin to the panel.
			// see https://github.com/WordPress/gutenberg/pull/55360#pullrequestreview-1737671049
			className="edit-post-sidebar__panel"
			headerClassName="edit-post-sidebar__panel-tabs"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Settings' ) }
			toggleShortcut={ keyboardShortcut }
			icon={ isRTL() ? drawerLeft : drawerRight }
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
		>
			<Tabs.Context.Provider value={ tabsContextValue }>
				<Tabs.TabPanel tabId={ sidebars.document } focusable={ false }>
					{ ! isEditingTemplate && (
						<>
							<PostStatus />
							<PluginDocumentSettingPanel.Slot />
							<PostLastRevisionPanel />
							<PostTaxonomiesPanel />
							<PostFeaturedImagePanel />
							<PostExcerptPanel />
							<PostDiscussionPanel />
							<PageAttributesPanel />
							<MetaBoxes location="side" />
						</>
					) }
					{ isEditingTemplate && <TemplateSummary /> }
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId={ sidebars.block } focusable={ false }>
					<BlockInspector />
				</Tabs.TabPanel>
			</Tabs.Context.Provider>
		</PluginSidebarEditPost>
	);
};

const SettingsSidebar = () => {
	const {
		sidebarName,
		isSettingsSidebarActive,
		keyboardShortcut,
		isEditingTemplate,
	} = useSelect( ( select ) => {
		// The settings sidebar is used by the edit-post/document and edit-post/block sidebars.
		// sidebarName represents the sidebar that is active or that should be active when the SettingsSidebar toggle button is pressed.
		// If one of the two sidebars is active the component will contain the content of that sidebar.
		// When neither of the two sidebars is active we can not simply return null, because the PluginSidebarEditPost
		// component, besides being used to render the sidebar, also renders the toggle button. In that case sidebarName
		// should contain the sidebar that will be active when the toggle button is pressed. If a block
		// is selected, that should be edit-post/block otherwise it's edit-post/document.
		let sidebar = select( interfaceStore ).getActiveComplementaryArea(
			editPostStore.name
		);
		let isSettingsSidebar = true;
		if ( ! [ sidebars.document, sidebars.block ].includes( sidebar ) ) {
			isSettingsSidebar = false;
			if ( select( blockEditorStore ).getBlockSelectionStart() ) {
				sidebar = sidebars.block;
			}
			sidebar = sidebars.document;
		}
		const shortcut = select(
			keyboardShortcutsStore
		).getShortcutRepresentation( 'core/edit-post/toggle-sidebar' );
		return {
			sidebarName: sidebar,
			isSettingsSidebarActive: isSettingsSidebar,
			keyboardShortcut: shortcut,
			isEditingTemplate:
				select( editorStore ).getCurrentPostType() === 'wp_template',
		};
	}, [] );

	const { openGeneralSidebar } = useDispatch( editPostStore );

	const onTabSelect = useCallback(
		( newSelectedTabId ) => {
			if ( !! newSelectedTabId ) {
				openGeneralSidebar( newSelectedTabId );
			}
		},
		[ openGeneralSidebar ]
	);

	return (
		<Tabs
			// Due to how this component is controlled (via a value from the
			// `interfaceStore`), when the sidebar closes the currently selected
			// tab can't be found. This causes the component to continuously reset
			// the selection to `null` in an infinite loop.Proactively setting
			// the selected tab to `null` avoids that.
			selectedTabId={ isSettingsSidebarActive ? sidebarName : null }
			onSelect={ onTabSelect }
		>
			<SidebarContent
				sidebarName={ sidebarName }
				keyboardShortcut={ keyboardShortcut }
				isEditingTemplate={ isEditingTemplate }
			/>
		</Tabs>
	);
};

export default SettingsSidebar;
