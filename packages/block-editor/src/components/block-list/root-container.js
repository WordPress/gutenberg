/**
 * WordPress dependencies
 */
import { createContext, forwardRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { BACKSPACE, DELETE, ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import useMultiSelection from './use-multi-selection';
import { getBlockClientId, getBlockWrapperNode } from '../../utils/dom';
import InsertionPoint from './insertion-point';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

export const Context = createContext();

function selector( select ) {
	const {
		getSelectedBlockClientId,
		hasMultiSelection,
		isMultiSelecting,
		getBlockRootClientId,
		getTemplateLock,
		getBlockIndex,
	} = select( 'core/block-editor' );
	const clientId = getSelectedBlockClientId();
	const rootClientId = getBlockRootClientId( clientId );
	const templateLock = getTemplateLock( rootClientId );
	const blockIndex = getBlockIndex( clientId );

	return {
		selectedBlockClientId: clientId,
		hasMultiSelection: hasMultiSelection(),
		isMultiSelecting: isMultiSelecting(),
		isLocked: !! templateLock,
		rootClientId,
		blockIndex,
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

function RootContainer( { children, className }, ref ) {
	const {
		selectedBlockClientId,
		hasMultiSelection,
		isMultiSelecting,
		isLocked,
		rootClientId,
		blockIndex,
	} = useSelect( selector, [] );
	const {
		selectBlock,
		removeBlock,
		insertDefaultBlock,
	} = useDispatch( 'core/block-editor' );
	const onSelectionStart = useMultiSelection( ref );

	/**
	 * Marks the block as selected when focused and not already selected. This
	 * specifically handles the case where block does not set focus on its own
	 * (via `setFocus`), typically if there is no focusable input in the block.
	 *
	 * @param {WPSyntheticEvent} event
	 */
	function onFocus( event ) {
		if ( hasMultiSelection ) {
			return;
		}

		const clientId = getBlockClientId( event.target );

		if ( clientId && clientId !== selectedBlockClientId ) {
			selectBlock( clientId );
		}
	}

	/**
	 * Interprets keydown event intent to remove or insert after block if key
	 * event occurs on wrapper node. This can occur when the block has no text
	 * fields of its own, particularly after initial insertion, to allow for
	 * easy deletion and continuous writing flow to add additional content.
	 *
	 * @param {KeyboardEvent} event Keydown event.
	 */
	function onKeyDown( event ) {
		const { keyCode, target } = event;

		if ( ! selectedBlockClientId || isLocked ) {
			return;
		}

		if (
			keyCode !== ENTER &&
			keyCode !== BACKSPACE &&
			keyCode !== DELETE
		) {
			return;
		}

		const wrapper = getBlockWrapperNode( selectedBlockClientId );

		if ( wrapper !== target ) {
			return;
		}

		event.preventDefault();

		if ( keyCode === ENTER ) {
			insertDefaultBlock( {}, rootClientId, blockIndex + 1 );
		} else {
			removeBlock( selectedBlockClientId );
		}
	}

	return (
		<InsertionPoint
			className={ className }
			isMultiSelecting={ isMultiSelecting }
			selectedBlockClientId={ selectedBlockClientId }
		>
			{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
			<div
				ref={ ref }
				className={ className }
				onFocus={ onFocus }
				onDragStart={ onDragStart }
				onKeyDown={ onKeyDown }
			>
				<Context.Provider value={ onSelectionStart }>
					{ children }
				</Context.Provider>
			</div>
		</InsertionPoint>
	);
}

export default forwardRef( RootContainer );
