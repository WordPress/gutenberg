/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useRef } from '@wordpress/element';
import { Popover } from '@wordpress/components';
import { placeCaretAtVerticalEdge } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import { getClosestTabbable } from '../writing-flow';
import { getBlockDOMNode } from '../../utils/dom';

function Indicator( { clientId } ) {
	const showInsertionPoint = useSelect(
		( select ) => {
			const {
				getBlockIndex,
				getBlockInsertionPoint,
				isBlockInsertionPointVisible,
				getBlockRootClientId,
			} = select( 'core/block-editor' );
			const rootClientId = getBlockRootClientId( clientId );
			const blockIndex = getBlockIndex( clientId, rootClientId );
			const insertionPoint = getBlockInsertionPoint();
			return (
				isBlockInsertionPointVisible() &&
				insertionPoint.index === blockIndex &&
				insertionPoint.rootClientId === rootClientId
			);
		},
		[ clientId ]
	);

	if ( ! showInsertionPoint ) {
		return null;
	}

	return (
		<div className="block-editor-block-list__insertion-point-indicator" />
	);
}

export default function InsertionPoint( {
	className,
	isMultiSelecting,
	hasMultiSelection,
	selectedBlockClientId,
	children,
	containerRef,
} ) {
	const [ isInserterShown, setIsInserterShown ] = useState( false );
	const [ isInserterForced, setIsInserterForced ] = useState( false );
	const [ inserterElement, setInserterElement ] = useState( null );
	const [ inserterClientId, setInserterClientId ] = useState( null );
	const ref = useRef();
	const { multiSelectedBlockClientIds } = useSelect( ( select ) => {
		const { getMultiSelectedBlockClientIds } = select(
			'core/block-editor'
		);

		return {
			multiSelectedBlockClientIds: getMultiSelectedBlockClientIds(),
		};
	} );

	function onMouseMove( event ) {
		if ( event.target.className !== className ) {
			if ( isInserterShown ) {
				setIsInserterShown( false );
			}
			return;
		}

		const rect = event.target.getBoundingClientRect();
		const offset = event.clientY - rect.top;
		const element = Array.from( event.target.children ).find(
			( blockEl ) => {
				return blockEl.offsetTop > offset;
			}
		);

		if ( ! element ) {
			return;
		}

		const clientId = element.id.slice( 'block-'.length );

		if ( ! clientId ) {
			return;
		}

		const elementRect = element.getBoundingClientRect();

		if (
			event.clientX > elementRect.right ||
			event.clientX < elementRect.left
		) {
			if ( isInserterShown ) {
				setIsInserterShown( false );
			}
			return;
		}

		setIsInserterShown( true );
		setInserterElement( element );
		setInserterClientId( clientId );
	}

	function focusClosestTabbable( event ) {
		const { clientX, clientY, target } = event;

		// Only handle click on the wrapper specifically, and not an event
		// bubbled from the inserter itself.
		if ( target !== ref.current ) {
			return;
		}

		const targetRect = target.getBoundingClientRect();
		const isReverse = clientY < targetRect.top + targetRect.height / 2;
		const blockNode = getBlockDOMNode( inserterClientId );
		const container = isReverse ? containerRef.current : blockNode;
		const closest = getClosestTabbable( blockNode, true, container );
		const rect = new window.DOMRect( clientX, clientY, 0, 16 );

		if ( closest ) {
			placeCaretAtVerticalEdge( closest, isReverse, rect, false );
		}
	}

	// Hide the inserter above the selected block and during multi-selection.
	const isInserterHidden = hasMultiSelection
		? multiSelectedBlockClientIds.includes( inserterClientId )
		: inserterClientId === selectedBlockClientId;

	return (
		<>
			{ ! isMultiSelecting && ( isInserterShown || isInserterForced ) && (
				<Popover
					noArrow
					animate={ false }
					anchorRef={ inserterElement }
					position="top right left"
					focusOnMount={ false }
					className="block-editor-block-list__insertion-point-popover"
					__unstableSlotName="block-toolbar"
					__unstableFixedPosition={ false }
				>
					<div
						className="block-editor-block-list__insertion-point"
						style={ { width: inserterElement.offsetWidth } }
					>
						<Indicator clientId={ inserterClientId } />
						{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */ }
						<div
							ref={ ref }
							onFocus={ () => setIsInserterForced( true ) }
							onBlur={ () => setIsInserterForced( false ) }
							onClick={ focusClosestTabbable }
							// While ideally it would be enough to capture the
							// bubbling focus event from the Inserter, due to the
							// characteristics of click focusing of `button`s in
							// Firefox and Safari, it is not reliable.
							//
							// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
							tabIndex={ -1 }
							className={ classnames(
								'block-editor-block-list__insertion-point-inserter',
								{
									'is-inserter-hidden': isInserterHidden,
								}
							) }
						>
							<Inserter clientId={ inserterClientId } />
						</div>
					</div>
				</Popover>
			) }
			<div
				onMouseMove={
					! isInserterForced && ! isMultiSelecting
						? onMouseMove
						: undefined
				}
			>
				{ children }
			</div>
		</>
	);
}
