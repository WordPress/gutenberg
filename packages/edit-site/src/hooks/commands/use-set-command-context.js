/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { privateApis as commandsPrivateApis } from '@wordpress/commands';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { useHasEditorCanvasContainer } from '../../components/editor-canvas-container';

const { useCommandContext } = unlock( commandsPrivateApis );
const { useLocation } = unlock( routerPrivateApis );

/**
 * React hook used to set the correct command context based on the current state.
 */
export default function useSetCommandContext() {
	const { query = {} } = useLocation();
	const { canvas = 'view' } = query;
	const hasBlockSelected = useSelect( ( select ) => {
		return select( blockEditorStore ).getBlockSelectionStart();
	}, [] );

	const hasEditorCanvasContainer = useHasEditorCanvasContainer();

	// Sets the right context for the command palette
	let commandContext = 'site-editor';
	if ( canvas === 'edit' ) {
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
