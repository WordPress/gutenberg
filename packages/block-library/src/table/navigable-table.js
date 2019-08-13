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

		//
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

		// The user hasn't pressed a navigation key, abort early.
		if ( ! isNav ) {
			return;
		}

		// Abort if navigation has already been handled (e.g. RichText inline
		// boundaries).
		if ( event.nativeEvent.defaultPrevented ) {
			return;
		}

		const isAtEdge = isVertical ? isVerticalEdge : isHorizontalEdge;
		const isReverse = isUp || isLeft || isHome;
		const isCaretAtEdgeOfField = isAtEdge( target, isReverse );

		if ( ! isCaretAtEdgeOfField ) {
			return;
		}

		event.stopPropagation();
		event.preventDefault();

		const isPrimary = isKeyboardModifierEvent.primary( event );
		const nextCellLocation = getNextCellLocation( tableState, selectedCell, { isPrimary, isUp, isDown, isLeft, isRight, isHome, isEnd } );

		if ( ! nextCellLocation ) {
			return;
		}

		const contentEditableElement = getCellContentEditableElement( tableRef.current, nextCellLocation );

		if ( ! contentEditableElement ) {
			return;
		}

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
