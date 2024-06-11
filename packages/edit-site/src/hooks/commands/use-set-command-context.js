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
	// Sets the right context for the command palette
	let commandContext = 'site-editor';
	if ( canvasMode === 'edit' ) {
		commandContext = 'entity-edit';
	}
	if ( hasBlockSelected ) {
		commandContext = 'block-selection-edit';
	}
	useCommandContext( commandContext );
}
