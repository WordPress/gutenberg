/**
 * WordPress dependencies
 */
import * as interfaceApis from '@wordpress/interface';

/**
 * Internal dependencies
 */
import CollapsableBlockToolbar from './components/collapsible-block-toolbar';
import EditorCanvas from './components/editor-canvas';
import { ExperimentalEditorProvider } from './components/provider';
import { lock } from './lock-unlock';
import { EntitiesSavedStatesExtensible } from './components/entities-saved-states';
import useAutoSwitchEditorSidebars from './components/provider/use-auto-switch-editor-sidebars';
import useBlockEditorSettings from './components/provider/use-block-editor-settings';
import DocumentTools from './components/document-tools';
import InserterSidebar from './components/inserter-sidebar';
import ListViewSidebar from './components/list-view-sidebar';
import MoreMenu from './components/more-menu';
import PatternOverridesPanel from './components/pattern-overrides-panel';
import PluginPostExcerpt from './components/post-excerpt/plugin';
import PostPanelRow from './components/post-panel-row';
import PostViewLink from './components/post-view-link';
import PreviewDropdown from './components/preview-dropdown';
import PreferencesModal from './components/preferences-modal';
import PostActions from './components/post-actions';
import { usePostActions } from './components/post-actions/actions';
import PostCardPanel from './components/post-card-panel';
import PostStatus from './components/post-status';
import ToolsMoreMenuGroup from './components/more-menu/tools-more-menu-group';
import ViewMoreMenuGroup from './components/more-menu/view-more-menu-group';
import { PrivatePostExcerptPanel } from './components/post-excerpt/panel';
import PostPublishButtonOrToggle from './components/post-publish-button/post-publish-button-or-toggle';
import SavePublishPanels from './components/save-publish-panels';
import PostContentInformation from './components/post-content-information';
import PostLastEditedPanel from './components/post-last-edited-panel';

const { store: interfaceStore, ...remainingInterfaceApis } = interfaceApis;

export const privateApis = {};
lock( privateApis, {
	CollapsableBlockToolbar,
	DocumentTools,
	EditorCanvas,
	ExperimentalEditorProvider,
	EntitiesSavedStatesExtensible,
	InserterSidebar,
	ListViewSidebar,
	MoreMenu,
	PatternOverridesPanel,
	PluginPostExcerpt,
	PostActions,
	PostPanelRow,
	PostViewLink,
	PreviewDropdown,
	PreferencesModal,
	usePostActions,
	PostCardPanel,
	PostStatus,
	ToolsMoreMenuGroup,
	ViewMoreMenuGroup,
	PrivatePostExcerptPanel,
	PostPublishButtonOrToggle,
	SavePublishPanels,
	PostContentInformation,
	PostLastEditedPanel,

	// This is a temporary private API while we're updating the site editor to use EditorProvider.
	useAutoSwitchEditorSidebars,
	useBlockEditorSettings,
	interfaceStore,
	...remainingInterfaceApis,
} );
