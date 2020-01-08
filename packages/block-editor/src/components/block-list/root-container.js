/**
 * WordPress dependencies
 */
import { useRef, createContext, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useMultiSelection from './use-multi-selection';
import { getBlockClientId } from '../../utils/dom';
import BlockInsertionPoint from './insertion-point';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

export const Context = createContext();

function selector( select ) {
	const {
		getSelectedBlockClientId,
		hasMultiSelection,
		isMultiSelecting,
		getBlockRootClientId,
	} = select( 'core/block-editor' );

	return {
		selectedBlockClientId: getSelectedBlockClientId(),
		hasMultiSelection: hasMultiSelection(),
		isMultiSelecting: isMultiSelecting(),
		getBlockRootClientId,
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

export default function RootContainer( { children, className } ) {
	const ref = useRef();
	const {
		selectedBlockClientId,
		hasMultiSelection,
		isMultiSelecting,
		getBlockRootClientId,
	} = useSelect( selector, [] );
	const { selectBlock } = useDispatch( 'core/block-editor' );
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

	const [ isInserterShown, setIsInserterShown ] = useState( false );
	const [ isInserterForced, setIsInserterForced ] = useState( false );
	const [ inserterElement, setInserterElement ] = useState( null );
	const [ inserterClientId, setInserterClientId ] = useState( null );
	const [ inserterRootClientId, setInserterRootClientId ] = useState( null );

	function onMouseMove( event ) {
		if ( event.target.className !== className ) {
			if ( isInserterShown ) {
				setIsInserterShown( false );
			}
			return;
		}

		const rect = event.target.getBoundingClientRect();
		const offset = event.clientY - rect.top;
		const element = Array.from( event.target.children ).find( ( blockEl ) => {
			return blockEl.offsetTop > offset;
		} );

		if ( ! element ) {
			return;
		}

		const clientId = element.id.slice( 'block-'.length );

		if ( ! clientId ) {
			return;
		}

		const elementRect = element.getBoundingClientRect();

		if ( event.clientX > elementRect.right || event.clientX < elementRect.left ) {
			if ( isInserterShown ) {
				setIsInserterShown( false );
			}
			return;
		}

		setIsInserterShown( true );
		setInserterElement( element );
		setInserterClientId( clientId );
		setInserterRootClientId( getBlockRootClientId( clientId ) );
	}

	return <>
		{ ( isInserterShown || isInserterForced ) && ! isMultiSelecting &&
			<Popover
				noArrow
				animate={ false }
				anchorRef={ inserterElement }
				position="top right left"
				focusOnMount={ false }
				className="block-editor-block-list__block-popover"
				__unstableSlotName="block-toolbar"
			>
				<BlockInsertionPoint
					rootClientId={ inserterRootClientId }
					clientId={ inserterClientId }
					onFocus={ () => setIsInserterForced( true ) }
					onBlur={ () => setIsInserterForced( false ) }
					width={ inserterElement.offsetWidth }
				/>
			</Popover>
		}
		<div
			ref={ ref }
			className={ className }
			onFocus={ onFocus }
			onDragStart={ onDragStart }
			onMouseMove={ ( isInserterForced || isMultiSelecting ) ? undefined : onMouseMove }
		>
			<Context.Provider value={ onSelectionStart }>
				{ children }
			</Context.Provider>
		</div>
	</>;
}
