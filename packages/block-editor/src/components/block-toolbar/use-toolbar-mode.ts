import { useState } from '@wordpress/element';
import type { ToolbarMode } from './types';

/**
 * Tracks whether the block toolbar is showing the design tools or the writing
 * tools.
 *
 * The choice belongs to the selection: putting the caret in a block's text
 * starts you writing, selecting a block any other way starts you designing,
 * and the switch overrides either until the selection moves again.
 *
 * @param clientId       The selected block's client ID.
 * @param isTextSelected Whether the selection sits in the block's text.
 *
 * @return The mode the toolbar is in, and a setter for it.
 */
export function useToolbarMode(
	clientId: string | undefined,
	isTextSelected: boolean | undefined
): [ ToolbarMode, ( mode: ToolbarMode ) => void ] {
	const [ mode, setMode ] = useState< ToolbarMode >(
		isTextSelected ? 'write' : 'design'
	);
	const [ selection, setSelection ] = useState( {
		clientId,
		isTextSelected,
	} );

	if (
		selection.clientId !== clientId ||
		selection.isTextSelected !== isTextSelected
	) {
		/*
		 * Deriving the mode during the render that brings the new selection
		 * in, rather than in an effect, means the toolbar never paints one
		 * mode's tools for a selection that belongs in the other's.
		 */
		const next: ToolbarMode = isTextSelected ? 'write' : 'design';
		setSelection( { clientId, isTextSelected } );
		setMode( next );
		return [ next, setMode ];
	}

	return [ mode, setMode ];
}
