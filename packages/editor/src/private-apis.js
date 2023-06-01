/**
 * Internal dependencies
 */
import { ExperimentalEditorProvider } from './components/provider';
import { lock } from './lockUnlock';
import { EntitiesSavedStatesExtensible } from './components/entities-saved-states';

export const privateApis = {};
lock( privateApis, {
	ExperimentalEditorProvider,
	EntitiesSavedStatesExtensible,
} );
