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
import EditorContentSlotFill from './components/editor-interface/content-slot-fill';
import useBlockEditorSettings from './components/provider/use-block-editor-settings';
import BackButton from './components/header/back-button';
import EditorInterface from './components/editor-interface';
import CreateTemplatePartModal from './components/create-template-part-modal';
import PluginPostExcerpt from './components/post-excerpt/plugin';
import PreferencesModal from './components/preferences-modal';
import { usePostActions } from './components/post-actions/actions';
import ToolsMoreMenuGroup from './components/more-menu/tools-more-menu-group';
import ViewMoreMenuGroup from './components/more-menu/view-more-menu-group';
import ResizableEditor from './components/resizable-editor';
import Sidebar from './components/sidebar';
import {
	mergeBaseAndUserConfigs,
	GlobalStylesProvider,
} from './components/global-styles-provider';

const { store: interfaceStore, ...remainingInterfaceApis } = interfaceApis;

export const privateApis = {};
lock( privateApis, {
	CreateTemplatePartModal,
	BackButton,
	ExperimentalEditorProvider,
	EntitiesSavedStatesExtensible,
	EditorInterface,
	EditorContentSlotFill,
	GlobalStylesProvider,
	mergeBaseAndUserConfigs,
	PluginPostExcerpt,
	PreferencesModal,
	usePostActions,
	ToolsMoreMenuGroup,
	ViewMoreMenuGroup,
	ResizableEditor,
	Sidebar,

	// This is a temporary private API while we're updating the site editor to use EditorProvider.
	useBlockEditorSettings,
	interfaceStore,
	...remainingInterfaceApis,
} );
