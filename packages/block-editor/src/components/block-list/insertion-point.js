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

function InsertionPointInserter( {
	clientId,
	setIsInserterForced,
	containerRef,
} ) {
	const ref = useRef();
	// Hide the inserter above the selected block and during multi-selection.
	const isInserterHidden = useSelect(
		( select ) => {
			const {
				getMultiSelectedBlockClientIds,
				getSelectedBlockClientId,
				hasMultiSelection,
				getSettings,
			} = select( 'core/block-editor' );
			const { hasReducedUI } = getSettings();
			if ( hasReducedUI ) {
				return true;
			}
			const multiSelectedBlockClientIds = getMultiSelectedBlockClientIds();
			const selectedBlockClientId = getSelectedBlockClientId();
			return hasMultiSelection()
				? multiSelectedBlockClientIds.includes( clientId )
				: clientId === selectedBlockClientId;
		},
		[ clientId ]
	);

	function focusClosestTabbable( event ) {
		const { clientX, clientY, target } = event;

		// Only handle click on the wrapper specifically, and not an event
		// bubbled from the inserter itself.
		if ( target !== ref.current ) {
			return;
		}

		const targetRect = target.getBoundingClientRect();
		const isReverse = clientY < targetRect.top + targetRect.height / 2;
		const blockNode = getBlockDOMNode( clientId );
		const container = isReverse ? containerRef.current : blockNode;
		const closest =
			getClosestTabbable( blockNode, true, container ) || blockNode;
		const rect = new window.DOMRect( clientX, clientY, 0, 16 );

		placeCaretAtVerticalEdge( closest, isReverse, rect, false );
	}

	return (
		/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
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
			<Inserter
				position="bottom center"
				clientId={ clientId }
				__experimentalIsQuick
			/>
		</div>
	);
}

function InsertionPointPopover( {
	clientId,
	isInserterShown,
	isInserterForced,
	setIsInserterForced,
	containerRef,
	showInsertionPoint,
} ) {
	const element = getBlockDOMNode( clientId );

	return (
		<Popover
			noArrow
			animate={ false }
			anchorRef={ element }
			position="top right left"
			focusOnMount={ false }
			className="block-editor-block-list__insertion-point-popover"
			__unstableSlotName="block-toolbar"
		>
			<div
				className="block-editor-block-list__insertion-point"
				style={ { width: element?.offsetWidth } }
			>
				{ showInsertionPoint && (
					<div className="block-editor-block-list__insertion-point-indicator" />
				) }
				{ ( isInserterShown || isInserterForced ) && (
					<InsertionPointInserter
						clientId={ clientId }
						setIsInserterForced={ setIsInserterForced }
						containerRef={ containerRef }
					/>
				) }
			</div>
		</Popover>
	);
}

export default function InsertionPoint( { children, containerRef } ) {
	const [ isInserterShown, setIsInserterShown ] = useState( false );
	const [ isInserterForced, setIsInserterForced ] = useState( false );
	const [ inserterClientId, setInserterClientId ] = useState( null );
	const { isMultiSelecting, isInserterVisible, selectedClientId } = useSelect(
		( select ) => {
			const {
				isMultiSelecting: _isMultiSelecting,
				isBlockInsertionPointVisible,
				getBlockInsertionPoint,
				getBlockOrder,
			} = select( 'core/block-editor' );

			const insertionPoint = getBlockInsertionPoint();
			const order = getBlockOrder( insertionPoint.rootClientId );

			return {
				isMultiSelecting: _isMultiSelecting(),
				isInserterVisible: isBlockInsertionPointVisible(),
				selectedClientId: order[ insertionPoint.index ],
			};
		},
		[]
	);

	function onMouseMove( event ) {
		if (
			! event.target.classList.contains(
				'block-editor-block-list__layout'
			)
		) {
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
		setInserterClientId( clientId );
	}

	const isVisible = isInserterShown || isInserterForced || isInserterVisible;

	return (
		<>
			{ ! isMultiSelecting && isVisible && (
				<InsertionPointPopover
					clientId={
						isInserterVisible ? selectedClientId : inserterClientId
					}
					isInserterShown={ isInserterShown }
					isInserterForced={ isInserterForced }
					setIsInserterForced={ setIsInserterForced }
					containerRef={ containerRef }
					showInsertionPoint={ isInserterVisible }
				/>
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
