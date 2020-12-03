/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createContext, forwardRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useMultiSelection from './use-multi-selection';
import { getBlockClientId } from '../../utils/dom';
import useInsertionPoint from './insertion-point';
import BlockPopover from './block-popover';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

export const Context = createContext();
export const BlockNodes = createContext();
export const SetBlockNodes = createContext();

/**
 * Prevents default dragging behavior within a block.
 * To do: we must handle this in the future and clean up the drag target.
 * Previously dragging was prevented for multi-selected, but this is no longer
 * needed.
 *
 * @param {WPSyntheticEvent} event Synthetic drag event.
 */
function onDragStart( event ) {
	// Ensure we target block content, not block controls.
	if ( getBlockClientId( event.target ) ) {
		event.preventDefault();
	}
}

function RootContainer( { children, className }, ref ) {
	const onSelectionStart = useMultiSelection( ref );
	const [ blockNodes, setBlockNodes ] = useState( {} );
	const insertionPoint = useInsertionPoint( ref );

	return (
		<BlockNodes.Provider value={ blockNodes }>
			{ insertionPoint }
			<BlockPopover />
			<div
				ref={ ref }
				className={ classnames( className, 'is-root-container' ) }
				onDragStart={ onDragStart }
			>
				<SetBlockNodes.Provider value={ setBlockNodes }>
					<Context.Provider value={ onSelectionStart }>
						{ children }
					</Context.Provider>
				</SetBlockNodes.Provider>
			</div>
		</BlockNodes.Provider>
	);
}

export default forwardRef( RootContainer );
