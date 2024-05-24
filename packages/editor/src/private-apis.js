/**
 * WordPress dependencies
 */
import * as interfaceApis from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { ExperimentalEditorProvider } from './components/provider';
import { lock } from './lock-unlock';
import { EntitiesSavedStatesExtensible } from './components/entities-saved-states';
import useAutoSwitchEditorSidebars from './components/provider/use-auto-switch-editor-sidebars';
import useBlockEditorSettings from './components/provider/use-block-editor-settings';
import Header from './components/header';
import InserterSidebar from './components/inserter-sidebar';
import ListViewSidebar from './components/list-view-sidebar';
import PatternOverridesPanel from './components/pattern-overrides-panel';
import PluginPostExcerpt from './components/post-excerpt/plugin';
import PostPanelRow from './components/post-panel-row';
import PreferencesModal from './components/preferences-modal';
import PostActions from './components/post-actions';
import { usePostActions } from './components/post-actions/actions';
import PostCardPanel from './components/post-card-panel';
import PostStatus from './components/post-status';
import ToolsMoreMenuGroup from './components/more-menu/tools-more-menu-group';
import ViewMoreMenuGroup from './components/more-menu/view-more-menu-group';
import { PrivatePostExcerptPanel } from './components/post-excerpt/panel';
import SavePublishPanels from './components/save-publish-panels';
import PostContentInformation from './components/post-content-information';
import PostLastEditedPanel from './components/post-last-edited-panel';
import ResizableEditor from './components/resizable-editor';
import Sidebar from './components/sidebar';
import TextEditor from './components/text-editor';
import VisualEditor from './components/visual-editor';
import {
	mergeBaseAndUserConfigs,
	GlobalStylesProvider,
} from './components/global-styles-provider';

const { store: interfaceStore, ...remainingInterfaceApis } = interfaceApis;

export const privateApis = {};
lock( privateApis, {
	ExperimentalEditorProvider,
	EntitiesSavedStatesExtensible,
	GlobalStylesProvider,
	Header,
	InserterSidebar,
	ListViewSidebar,
	mergeBaseAndUserConfigs,
	PatternOverridesPanel,
	PluginPostExcerpt,
	PostActions,
	PostPanelRow,
	PreferencesModal,
	usePostActions,
	PostCardPanel,
	PostStatus,
	ToolsMoreMenuGroup,
	ViewMoreMenuGroup,
	PrivatePostExcerptPanel,
	SavePublishPanels,
	PostContentInformation,
	PostLastEditedPanel,
	ResizableEditor,
	Sidebar,
	TextEditor,
	VisualEditor,

	// This is a temporary private API while we're updating the site editor to use EditorProvider.
	useAutoSwitchEditorSidebars,
	useBlockEditorSettings,
	interfaceStore,
	...remainingInterfaceApis,
} );
