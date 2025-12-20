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

	// Sets the right context for the command palette
	let commandContext = 'site-editor';
	if ( canvas === 'edit' ) {
		commandContext = 'entity-edit';
	}
	if ( hasBlockSelected ) {
		commandContext = 'block-selection-edit';
	}
	useCommandContext( commandContext );
}
