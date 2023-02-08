/**
 * Internal dependencies
 */
import { ExperimentalEditorProvider } from './components/provider';
import { lock } from './lockUnlock';

export const experiments = {};
lock( experiments, {
	ExperimentalEditorProvider,
} );
