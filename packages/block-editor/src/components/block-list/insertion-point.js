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
			} = select( 'core/block-editor' );
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
} ) {
	return clientId.map( ( id, index ) => {
		const element = getBlockDOMNode( id );

		return (
			<Popover
				key={ `${ index }${ id }` }
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
					<div className="block-editor-block-list__insertion-point-indicator" />
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
	} );
}

export default function InsertionPoint( { children, containerRef } ) {
	const [ isInserterShown, setIsInserterShown ] = useState( false );
	const [ isInserterForced, setIsInserterForced ] = useState( false );
	const [ inserterClientId, setInserterClientId ] = useState( [] );
	const { isMultiSelecting, isInserterVisible, blockOrder } = useSelect(
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
				blockOrder: order,
			};
		},
		[]
	);

	function onMouseMove( event ) {
		const clientId = event.target.id.slice( 'block-'.length );
		const index = blockOrder.findIndex( ( id ) => id === clientId );

		// when there is no match return
		if ( index === -1 ) {
			setInserterClientId( [] );
			setIsInserterShown( false );
			return;
		}

		setIsInserterShown( true );

		// first element should have only bottom inserter
		if ( index === 0 ) {
			// eslint-disable-next-line no-unused-vars
			const [ firstTop, firstBottom, ...rest ] = blockOrder;
			setInserterClientId( [ firstBottom ] );
			return;
		}

		// last element should have only top inserter
		if ( index === blockOrder.length ) {
			const lastTop = blockOrder.slice( -1 );
			setInserterClientId( [ lastTop ] );
			return;
		}

		const top = blockOrder[ index ];
		const bottom = blockOrder[ index + 1 ];
		setInserterClientId( [ top, bottom ] );
	}
	const isVisible = isInserterShown || isInserterForced || isInserterVisible;

	return (
		<>
			{ ! isMultiSelecting && isVisible && (
				<InsertionPointPopover
					clientId={ inserterClientId }
					isInserterShown={ isInserterShown }
					isInserterForced={ isInserterForced }
					setIsInserterForced={ setIsInserterForced }
					containerRef={ containerRef }
					showInsertionPoint={ isInserterVisible }
				/>
			) }
			<div onMouseMove={ onMouseMove }> { children } </div>
		</>
	);
}
