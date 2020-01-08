/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';

function Indicator( { rootClientId, clientId } ) {
	const showInsertionPoint = useSelect( ( select ) => {
		const {
			getBlockIndex,
			getBlockInsertionPoint,
			isBlockInsertionPointVisible,
		} = select( 'core/block-editor' );
		const blockIndex = getBlockIndex( clientId, rootClientId );
		const insertionPoint = getBlockInsertionPoint();
		return (
			isBlockInsertionPointVisible() &&
			insertionPoint.index === blockIndex &&
			insertionPoint.rootClientId === rootClientId
		);
	}, [ clientId, rootClientId ] );

	if ( ! showInsertionPoint ) {
		return null;
	}

	return <div className="block-editor-block-list__insertion-point-indicator" />;
}

function selector( select ) {
	return select( 'core/block-editor' ).getBlockRootClientId;
}

export default function useInsertionPoint( {
	className,
	isMultiSelecting,
	selectedBlockClientId,
} ) {
	const getBlockRootClientId = useSelect( selector, [] );
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

		if ( ! clientId || clientId === selectedBlockClientId ) {
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

	const InsertionPoint = useCallback( () => {
		return (
			<Popover
				noArrow
				animate={ false }
				anchorRef={ inserterElement }
				position="top right left"
				focusOnMount={ false }
				className="block-editor-block-list__block-popover"
				__unstableSlotName="block-toolbar"
			>
				<div className="block-editor-block-list__insertion-point" style={ { width: inserterElement.offsetWidth } }>
					<Indicator clientId={ inserterClientId } rootClientId={ inserterRootClientId } />
					<div
						onFocus={ () => setIsInserterForced( true ) }
						onBlur={ () => setIsInserterForced( false ) }
						// While ideally it would be enough to capture the
						// bubbling focus event from the Inserter, due to the
						// characteristics of click focusing of `button`s in
						// Firefox and Safari, it is not reliable.
						//
						// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
						tabIndex={ -1 }
						className="block-editor-block-list__insertion-point-inserter"
					>
						<Inserter
							rootClientId={ inserterRootClientId }
							clientId={ inserterClientId }
						/>
					</div>
				</div>
			</Popover>
		);
	}, [ inserterClientId ] );

	const props = {};

	if ( ! isInserterForced && ! isMultiSelecting ) {
		props.onMouseMove = onMouseMove;
	}

	if ( ! isMultiSelecting && ( isInserterShown || isInserterForced ) ) {
		props.InsertionPoint = InsertionPoint;
	}

	return props;
}
