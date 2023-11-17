/**
 * Internal dependencies
 */
import { ExperimentalEditorProvider } from './components/provider';
import { lock } from './lock-unlock';
import { EntitiesSavedStatesExtensible } from './components/entities-saved-states';
import useBlockEditorSettings from './components/provider/use-block-editor-settings';

export const privateApis = {};
lock( privateApis, {
	ExperimentalEditorProvider,
	EntitiesSavedStatesExtensible,

	// This is a temporary private API while we're updating the site editor to use EditorProvider.
	useBlockEditorSettings,
} );
