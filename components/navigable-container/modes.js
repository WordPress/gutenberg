/**
 * External Dependencies
 */
import { pick } from 'lodash';

/**
 * WordPress Dependencies
 */
import { keycodes } from '@wordpress/utils';

/**
 * Module Constants
 */
const { UP, DOWN, LEFT, RIGHT, TAB } = keycodes;

const arrowKeys = [ UP, DOWN, LEFT, RIGHT ];

function cycleValue( value, total, offset ) {
	const nextValue = value + offset;
	if ( nextValue < 0 ) {
		return total + nextValue;
	} else if ( nextValue >= total ) {
		return nextValue - total;
	}

	return nextValue;
}

export function calculateMode( navigation ) {
	switch ( navigation.mode ) {
		case 'tabbing':
			const tabConfig = { cycle: true, deep: false, widget: true, ...navigation };
			return {
				...pick( tabConfig, [ 'deep', 'widget', 'initialSelector' ] ),
				useTabstops: true,
				detect: ( event ) => {
					const { keyCode, shiftKey } = event;
					if ( TAB === keyCode ) {
						return ( index, total ) => {
							const offset = shiftKey ? -1 : 1;
							return tabConfig.cycle ? cycleValue( index, total, offset ) : index + offset;
						};
					}
				},
			};

		case 'menu':
			const rowConfig = { cycle: true, deep: false, widget: false, orientation: 'vertical', stopOtherArrows: true, ...navigation };
			return {
				...pick( rowConfig, [ 'deep', 'widget', 'initialSelector' ] ),
				useTabstops: false,
				detect: ( event ) => {
					const { keyCode } = event;
					const available = rowConfig.orientation === 'horizontal' ? [ LEFT, RIGHT ] : [ UP, DOWN ];
					if ( available.indexOf( keyCode ) !== -1 ) {
						return ( index, total ) => {
							const offset = ( keyCode === LEFT || keyCode === UP ) ? -1 : 1;
							return rowConfig.cycle ? cycleValue( index, total, offset ) : index + offset;
						};
					} else if ( rowConfig.stopOtherArrows && arrowKeys.indexOf( keyCode ) !== -1 ) {
						// Stop other components from getting the arrow keys. Note, this might need to be amended
						// if inputs etc. are inside this container. We might want to check the target. It's only
						// necessary now because of WritingFlow's keydown handlers.
						event.nativeEvent.stopImmediatePropagation();
						event.stopPropagation();
						event.preventDefault();
					}

					return null;
				},
			};

		case 'grid': {
			const gridConfig = { deep: false, widget: false, width: 1, ...navigation };
			const { width } = gridConfig;

			const getCoords = ( index ) => {
				const column = index % width;
				const row = Math.floor( index / width );
				return { column, row };
			};

			const toIndex = ( coord ) => {
				return ( coord.row * width ) + coord.column;
			};

			const getColumnsInRow = ( row, total ) => {
				// All but the last row will have the full number of columns (width)
				const lastCoord = getCoords( total - 1 );
				return row === lastCoord.row ? lastCoord.column + 1 : width;
			};

			const moveHorizontally = ( index, total, movement ) => {
				const coord = getCoords( index );
				const newColumn = movement( coord );
				return toIndex( { column: newColumn, row: coord.row } );
			};

			const moveVertically = ( index, total, movement, fallback ) => {
				const coord = getCoords( index );
				const lastCoord = getCoords( total - 1 );
				// Two edge conditions, pressing up in an irregular grid, and cycling.
				const nextPossibleRow = movement( coord, lastCoord );
				const columnsInNextRow = getColumnsInRow( nextPossibleRow, total );
				const nextRow = coord.column >= columnsInNextRow ? fallback( nextPossibleRow ) : nextPossibleRow;
				return toIndex( { column: coord.column, row: nextRow } );
			};

			return {
				...pick( gridConfig, [ 'deep', 'widget', 'initialSelector' ] ),
				useTabstops: false,
				detect: ( event ) => {
					const { keyCode } = event;
					switch ( keyCode ) {
						case LEFT:
							return ( index, total ) => {
								const movement = ( coord ) => coord.column === 0 ? getColumnsInRow( coord.row, total ) - 1 : coord.column - 1;
								return moveHorizontally( index, total, movement );
							};
						case RIGHT:
							return ( index, total ) => {
								const movement = ( coord ) => {
									const onLastColumn = coord.column === getColumnsInRow( coord.row, total ) - 1;
									return onLastColumn ? 0 : coord.column + 1;
								};

								return moveHorizontally( index, total, movement );
							};
						case UP:
							return ( index, total ) => {
								const movement = ( coord, lastCoord ) => coord.row === 0 ? lastCoord.row : coord.row - 1;
								const fallback = ( possibleRow ) => possibleRow - 1;
								return moveVertically( index, total, movement, fallback );
							};
						case DOWN:
							return ( index, total ) => {
								const movement = ( coord, lastCoord ) => coord.row === lastCoord.row ? 0 : coord.row + 1;
								const fallback = ( /* possibleRow */ ) => 0;
								return moveVertically( index, total, movement, fallback );
							};
					}

					return null;
				},
			};
		}
	}

	return {
		deep: false,
		useTabstops: true,
		initialSelector: null,
		widget: false,
		rules: [ ],
	};
}
