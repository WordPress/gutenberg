/**
 * Internal dependencies
 */
import EditorCanvas from './components/editor-canvas';
import { ExperimentalEditorProvider } from './components/provider';
import { lock } from './lock-unlock';
import { EntitiesSavedStatesExtensible } from './components/entities-saved-states';
import useBlockEditorSettings from './components/provider/use-block-editor-settings';
import DocumentTools from './components/document-tools';
import InserterSidebar from './components/inserter-sidebar';
import ListViewSidebar from './components/list-view-sidebar';
import ModeSwitcher from './components/mode-switcher';
import PluginPostExcerpt from './components/post-excerpt/plugin';
import PostPanelRow from './components/post-panel-row';
import PostViewLink from './components/post-view-link';
import PreviewDropdown from './components/preview-dropdown';
import PreferencesModal from './components/preferences-modal';
import PostCardPanel from './components/post-card-panel';
import PostPublishButtonOrToggle from './components/post-publish-button/post-publish-button-or-toggle';

export const privateApis = {};
lock( privateApis, {
	DocumentTools,
	EditorCanvas,
	ExperimentalEditorProvider,
	EntitiesSavedStatesExtensible,
	InserterSidebar,
	ListViewSidebar,
	ModeSwitcher,
	PluginPostExcerpt,
	PostPanelRow,
	PostViewLink,
	PreviewDropdown,
	PreferencesModal,
	PostCardPanel,
	PostPublishButtonOrToggle,

	// This is a temporary private API while we're updating the site editor to use EditorProvider.
	useBlockEditorSettings,
} );
