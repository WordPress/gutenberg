/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { privateApis as commandsPrivateApis } from '@wordpress/commands';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useHasEditorCanvasContainer } from '../../components/editor-canvas-container';

const { useCommandContext } = unlock( commandsPrivateApis );

/**
 * React hook used to set the correct command context based on the current state.
 */
export default function useSetCommandContext() {
	const { hasBlockSelected, canvasMode } = useSelect( ( select ) => {
		const { getCanvasMode } = unlock( select( editSiteStore ) );
		const { getBlockSelectionStart } = select( blockEditorStore );
		return {
			canvasMode: getCanvasMode(),
			hasBlockSelected: getBlockSelectionStart(),
		};
	}, [] );

	const hasEditorCanvasContainer = useHasEditorCanvasContainer();

	// Sets the right context for the command palette
	let commandContext = 'site-editor';
	if ( canvasMode === 'edit' ) {
		commandContext = 'entity-edit';
	}
	if ( hasBlockSelected ) {
		commandContext = 'block-selection-edit';
	}
	if ( hasEditorCanvasContainer ) {
		/*
		 * The editor canvas overlay will likely be deprecated in the future, so for now we clear the command context
		 * to remove the suggested commands that may not make sense with Style Book or Style Revisions open.
		 * See https://github.com/WordPress/gutenberg/issues/62216.
		 */
		commandContext = '';
	}
	useCommandContext( commandContext );
}
