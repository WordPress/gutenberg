/**
 * Internal dependencies
 */
import { ExperimentalEditorProvider } from './components/provider';
import { lock } from './lockUnlock';

export const privateApis = {};
lock( privateApis, {
	ExperimentalEditorProvider,
} );
