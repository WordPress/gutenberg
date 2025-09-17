/**
 * WordPress dependencies
 */
import * as interfaceApis from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { EntitiesSavedStatesExtensible } from './components/entities-saved-states';
import EditorContentSlotFill from './components/editor-interface/content-slot-fill';
import BackButton from './components/header/back-button';
import Editor from './components/editor';
import PluginPostExcerpt from './components/post-excerpt/plugin';
import PostCardPanel from './components/post-card-panel';
import PreferencesModal from './components/preferences-modal';
import { usePostActions } from './components/post-actions/actions';
import usePostFields from './components/post-fields';
import ToolsMoreMenuGroup from './components/more-menu/tools-more-menu-group';
import ViewMoreMenuGroup from './components/more-menu/view-more-menu-group';
import ResizableEditor from './components/resizable-editor';
import {
	mergeBaseAndUserConfigs,
	GlobalStylesProvider,
} from './components/global-styles-provider';
import {
	CreateTemplatePartModal,
	patternTitleField,
	templateTitleField,
} from '@wordpress/fields';
import { registerCoreBlockBindingsSources } from './bindings/api';
import { getTemplateInfo } from './utils/get-template-info';

const { store: interfaceStore, ...remainingInterfaceApis } = interfaceApis;

export const privateApis = {};
lock( privateApis, {
	CreateTemplatePartModal,
	patternTitleField,
	templateTitleField,
	BackButton,
	EntitiesSavedStatesExtensible,
	Editor,
	EditorContentSlotFill,
	GlobalStylesProvider,
	mergeBaseAndUserConfigs,
	PluginPostExcerpt,
	PostCardPanel,
	PreferencesModal,
	usePostActions,
	usePostFields,
	ToolsMoreMenuGroup,
	ViewMoreMenuGroup,
	ResizableEditor,
	registerCoreBlockBindingsSources,
	getTemplateInfo,
	// This is a temporary private API while we're updating the site editor to use EditorProvider.
	interfaceStore,
	...remainingInterfaceApis,
} );
