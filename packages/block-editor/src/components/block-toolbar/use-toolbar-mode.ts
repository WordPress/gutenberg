import { useState } from '@wordpress/element';
import type { ToolbarMode } from './types';

/**
 * Tracks whether the block toolbar is showing the design tools or the writing
 * tools. The choice belongs to the selection: selecting another block starts
 * again from the design tools.
 *
 * @param clientId The selected block's client ID.
 *
 * @return The mode the toolbar is in, and a setter for it.
 */
export function useToolbarMode(
	clientId: string | undefined
): [ ToolbarMode, ( mode: ToolbarMode ) => void ] {
	const [ mode, setMode ] = useState< ToolbarMode >( 'design' );
	const [ modeClientId, setModeClientId ] = useState( clientId );

	if ( modeClientId !== clientId ) {
		// Resetting during the render that brings the new selection in, rather
		// than in an effect, means the toolbar never paints the writing tools
		// for a block that was only just selected.
		setModeClientId( clientId );
		setMode( 'design' );
		return [ 'design', setMode ];
	}

	return [ mode, setMode ];
}
