/**
 * WordPress dependencies
 */
import * as interfaceApis from '@wordpress/interface';

/**
 * Internal dependencies
 */
import EditorCanvas from './components/editor-canvas';
import { ExperimentalEditorProvider } from './components/provider';
import { lock } from './lock-unlock';
import { EntitiesSavedStatesExtensible } from './components/entities-saved-states';
import useAutoSwitchEditorSidebars from './components/provider/use-auto-switch-editor-sidebars';
import useBlockEditorSettings from './components/provider/use-block-editor-settings';
import DocumentTools from './components/document-tools';
import InserterSidebar from './components/inserter-sidebar';
import ListViewSidebar from './components/list-view-sidebar';
import ModeSwitcher from './components/mode-switcher';
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

const { store: interfaceStore, ...remainingInterfaceApis } = interfaceApis;

export const privateApis = {};
lock( privateApis, {
	DocumentTools,
	EditorCanvas,
	ExperimentalEditorProvider,
	EntitiesSavedStatesExtensible,
	InserterSidebar,
	ListViewSidebar,
	ModeSwitcher,
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

	// This is a temporary private API while we're updating the site editor to use EditorProvider.
	useAutoSwitchEditorSidebars,
	useBlockEditorSettings,
	interfaceStore,
	...remainingInterfaceApis,
} );
