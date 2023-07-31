/**
 * Internal dependencies
 */
import { ExperimentalEditorProvider } from './components/provider';
import { lock } from './lock-unlock';
import { EntitiesSavedStatesExtensible } from './components/entities-saved-states';
import CreatePatternModal from './components/create-pattern/create-pattern-modal';

export const privateApis = {};
lock( privateApis, {
	ExperimentalEditorProvider,
	EntitiesSavedStatesExtensible,
	CreatePatternModal,
} );
