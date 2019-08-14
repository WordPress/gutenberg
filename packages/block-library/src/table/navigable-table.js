/**
 * WordPress dependencies
 */
import {
	isTextField,
	isHorizontalEdge,
	isVerticalEdge,
	placeCaretAtHorizontalEdge,
} from '@wordpress/dom';
import { useRef } from '@wordpress/element';
import { UP, DOWN, LEFT, RIGHT, HOME, END, isKeyboardModifierEvent } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	getLocationOfCellAbove,
	getLocationOfCellBelow,
	getLocationOfCellToLeft,
	getLocationOfCellToRight,
	getLocationOfFirstCellInColumn,
	getLocationOfLastCellInColumn,
	getLocationOfFirstCellInRow,
	getLocationOfLastCellInRow,
	getLocationOfFirstCellInTable,
	getLocationOfLastCellInTable,
} from './state';

/**
 * Given the table state, the selected cell, and the knowledged of the pressed keys, determine the next cell location.
 *
 * @param {Object} tableState     The table state.
 * @param {Object} selectedCell   The selected cell.
 * @param {Object} navigationKeys Object containing booleans for the pressed keys.
 *
 * @return {Object} The location of the cell to navigate to.
 */
function getNextCellLocation( tableState, selectedCell, { isPrimary, isUp, isDown, isLeft, isRight, isHome, isEnd } ) {
	if ( isUp ) {
		if ( isPrimary ) {
			return getLocationOfFirstCellInColumn( tableState, selectedCell );
		}

		return getLocationOfCellAbove( tableState, selectedCell );
	}
	if ( isDown ) {
		if ( isPrimary ) {
			return getLocationOfLastCellInColumn( tableState, selectedCell );
		}

		return getLocationOfCellBelow( tableState, selectedCell );
	}
	if ( isLeft ) {
		if ( isPrimary ) {
			return getLocationOfFirstCellInRow( selectedCell );
		}

		return getLocationOfCellToLeft( selectedCell );
	}
	if ( isRight ) {
		if ( isPrimary ) {
			return getLocationOfLastCellInRow( tableState, selectedCell );
		}

		return getLocationOfCellToRight( tableState, selectedCell );
	}
	if ( isHome ) {
		if ( isPrimary ) {
			return getLocationOfFirstCellInTable( tableState );
		}
		return getLocationOfFirstCellInRow( selectedCell );
	}
	if ( isEnd ) {
		if ( isPrimary ) {
			return getLocationOfLastCellInTable( tableState );
		}
		return getLocationOfLastCellInRow( tableState, selectedCell );
	}
}

/**
 * Given a reference to the table element and the cell location, return the DOM element for the
 * contenteditable at the cell location.
 *
 * @param {Element} tableElement 			 The DOM table element
 * @param {Object}  cellLocation 			 The cell location.
 * @param {Object}  cellLocation.sectionName The table section name that the cell is within.
 * @param {Object}  cellLocation.rowIndex    The rowIndex for the cell.
 * @param {Object}  cellLocation.columnIndex The columnIndex for the cell.
 *
 * @return {Element} The contenteditable DOM element.
 */
function getCellContentEditableElement( tableElement, { sectionName, rowIndex, columnIndex } ) {
	if ( ! tableElement ) {
		return;
	}
	const rowElement = tableElement.querySelectorAll( `t${ sectionName } tr` )[ rowIndex ];

	if ( ! rowElement ) {
		return;
	}

	return rowElement.querySelectorAll( '*[contenteditable="true"]' )[ columnIndex ];
}

export default function NavigableTable( { children, className, tableState, selectedCell } ) {
	const tableRef = useRef();

	const handleKeyDown = ( event ) => {
		if ( ! selectedCell ) {
			return;
		}

		const { keyCode, target } = event;

		if ( ! isTextField( target ) ) {
			return;
		}

		const isUp = keyCode === UP;
		const isDown = keyCode === DOWN;
		const isLeft = keyCode === LEFT;
		const isRight = keyCode === RIGHT;
		const isHome = keyCode === HOME;
		const isEnd = keyCode === END;
		const isHorizontal = isLeft || isRight || isHome || isEnd;
		const isVertical = isUp || isDown;
		const isNav = isHorizontal || isVertical;

		// The user hasn't pressed a navigation key OR the event
		// had been handled by RichText. Abort early.
		if ( ! isNav || event.nativeEvent.defaultPrevented ) {
			return;
		}

		const isAtEdge = isVertical ? isVerticalEdge : isHorizontalEdge;
		const isReverse = isUp || isLeft || isHome;
		const isCaretAtEdgeOfField = isAtEdge( target, isReverse );

		// If the caret is still within a body of text, don't
		// continue to handle the event, bail early.
		if ( ! isCaretAtEdgeOfField ) {
			return;
		}

		// Signal our intention to handle the event by disallowing any
		// native or other event handling. Even if the next cell to
		// navigate to can't be found, selection should still remain in
		// the table block.
		event.stopPropagation();
		event.preventDefault();

		// Get the next cell location using the table state.
		const isPrimary = isKeyboardModifierEvent.primary( event );
		const nextCellLocation = getNextCellLocation( tableState, selectedCell, { isPrimary, isUp, isDown, isLeft, isRight, isHome, isEnd } );

		if ( ! nextCellLocation ) {
			return;
		}

		// Find the cell location in the DOM.
		const contentEditableElement = getCellContentEditableElement( tableRef.current, nextCellLocation );

		if ( ! contentEditableElement ) {
			return;
		}

		// Move the caret to the correct location.
		placeCaretAtHorizontalEdge( contentEditableElement, isReverse );
	};

	// Disable reason: Wrapper itself is non-interactive, but must capture
	// bubbling events from children to determine focus transition intents.
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
	return (
		<table
			ref={ tableRef }
			className={ className }
			onKeyDown={ handleKeyDown }
		>
			{ children }
		</table>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
	/* eslint-enable jsx-a11y/no-noninteractive-element-interactions */
}
