/**
 * WordPress dependencies
 */
import * as interfaceApis from '@wordpress/interface';

/**
 * Internal dependencies
 */
import VisualEditor from './components/visual-editor';
import { lock } from './lock-unlock';
import { EntitiesSavedStatesExtensible } from './components/entities-saved-states';
import useBlockEditorSettings from './components/provider/use-block-editor-settings';
import PluginPostExcerpt from './components/post-excerpt/plugin';
import PreferencesModal from './components/preferences-modal';
import ToolsMoreMenuGroup from './components/more-menu/tools-more-menu-group';
import ViewMoreMenuGroup from './components/more-menu/view-more-menu-group';

const { store: interfaceStore, ...remainingInterfaceApis } = interfaceApis;

export const privateApis = {};
lock( privateApis, {
	VisualEditor,
	EntitiesSavedStatesExtensible,
	PluginPostExcerpt,
	PreferencesModal,
	ToolsMoreMenuGroup,
	ViewMoreMenuGroup,

	// This is a temporary private API while we're updating the site editor to use EditorProvider.
	useBlockEditorSettings,
	interfaceStore,
	...remainingInterfaceApis,
} );
