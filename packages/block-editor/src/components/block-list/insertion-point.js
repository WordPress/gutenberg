/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useRef, useMemo, useContext } from '@wordpress/element';
import { Popover } from '@wordpress/components';
import { placeCaretAtVerticalEdge } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import { getClosestTabbable } from '../writing-flow';
import { getBlockDOMNode } from '../../utils/dom';
import { AppenderNodesContext } from '../block-list-appender';

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
	rootClientId,
	isInserterShown,
	isInserterForced,
	setIsInserterForced,
	containerRef,
	showInsertionPoint,
} ) {
	const appenderNodesMap = useContext( AppenderNodesContext );
	const element = useMemo( () => {
		if ( clientId ) {
			return getBlockDOMNode( clientId );
		}

		// Can't find the element, might be at the end of the block list, or inside an empty block list.
		// We instead try to find the "Appender" and place the indicator above it.
		// `rootClientId` could be null or undefined when there's no parent block, we normalize it to an empty string.
		return appenderNodesMap.get( rootClientId || '' );
	}, [ clientId, rootClientId, appenderNodesMap ] );

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
	const {
		isMultiSelecting,
		isInserterVisible,
		selectedClientId,
		selectedRootClientId,
	} = useSelect( ( select ) => {
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
			selectedRootClientId: insertionPoint.rootClientId,
		};
	}, [] );

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
		let element = Array.from( event.target.children ).find( ( blockEl ) => {
			return blockEl.offsetTop > offset;
		} );

		if ( ! element ) {
			return;
		}

		// The block may be in an alignment wrapper, so check the first direct
		// child if the element has no ID.
		if ( ! element.id ) {
			element = element.firstElementChild;

			if ( ! element ) {
				return;
			}
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
					rootClientId={ selectedRootClientId }
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
