/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createContext, forwardRef, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

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

function selector( select ) {
	const { getSelectedBlockClientId, hasMultiSelection } = select(
		'core/block-editor'
	);

	return {
		selectedBlockClientId: getSelectedBlockClientId(),
		hasMultiSelection: hasMultiSelection(),
	};
}

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

function useBlockFocus() {
	const { selectedBlockClientId, hasMultiSelection } = useSelect(
		selector,
		[]
	);
	const { selectBlock } = useDispatch( 'core/block-editor' );

	/**
	 * Marks the block as selected when focused and not already selected. This
	 * specifically handles the case where block does not set focus on its own
	 * (via `setFocus`), typically if there is no focusable input in the block.
	 *
	 * @param {WPSyntheticEvent} event
	 */
	return function onFocus( event ) {
		if ( hasMultiSelection ) {
			return;
		}

		const clientId = getBlockClientId( event.target );

		if ( clientId && clientId !== selectedBlockClientId ) {
			selectBlock( clientId );
		}
	};
}

function RootContainer( { children, className }, ref ) {
	const [ blockNodes, setBlockNodes ] = useState( {} );
	const { onMouseMove, popover } = useInsertionPoint( ref );
	const onSelectionStart = useMultiSelection( ref );
	const onFocus = useBlockFocus();

	return (
		<BlockNodes.Provider value={ blockNodes }>
			{ popover }
			<BlockPopover />
			<div
				ref={ ref }
				className={ classnames( className, 'is-root-container' ) }
				onFocus={ onFocus }
				onDragStart={ onDragStart }
				onMouseMove={ onMouseMove }
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
