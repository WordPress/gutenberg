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
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	getCellAbove,
	getCellBelow,
	getCellToLeft,
	getCellToRight,
} from './state';

function getNextCellLocation( tableState, selectedCell, { isUp, isDown, isLeft, isRight } ) {
	if ( isUp ) {
		return getCellAbove( tableState, selectedCell );
	}
	if ( isDown ) {
		return getCellBelow( tableState, selectedCell );
	}
	if ( isLeft ) {
		return getCellToLeft( selectedCell );
	}
	if ( isRight ) {
		return getCellToRight( tableState, selectedCell );
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

	return rowElement.querySelectorAll( 'tr,td *[contenteditable="true"]' )[ columnIndex ];
}

export default function NavigableTable( { children, className, tableState, selectedCell, onNavigation } ) {
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
		const isHorizontal = isLeft || isRight;
		const isVertical = isUp || isDown;
		const isNav = isHorizontal || isVertical;

		if ( ! isNav ) {
			return;
		}

		const isAtEdge = isVertical ? isVerticalEdge : isHorizontalEdge;
		const isReverse = isUp || isLeft;
		const isCaretAtEdgeOfField = isAtEdge( target, isReverse );

		if ( ! isCaretAtEdgeOfField ) {
			return;
		}

		event.stopPropagation();
		event.preventDefault();
		const nextCellLocation = getNextCellLocation( tableState, selectedCell, { isUp, isDown, isLeft, isRight } );

		if ( ! nextCellLocation ) {
			return;
		}

		const contentEditableElement = getCellContentEditableElement( tableRef.current, nextCellLocation );

		if ( ! contentEditableElement ) {
			return;
		}

		placeCaretAtHorizontalEdge( contentEditableElement, isReverse );
		onNavigation( nextCellLocation );
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
