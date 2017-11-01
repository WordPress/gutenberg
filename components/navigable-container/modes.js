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
			const gridConfig = { cycle: true, deep: false, widget: false, width: 1, ...navigation };
			return {
				...pick( gridConfig, [ 'deep', 'widget', 'initialSelector' ] ),
				useTabstops: false,
				detect: ( event ) => {
					const { keyCode } = event;
					const { width } = gridConfig;

					switch ( keyCode ) {
						case LEFT:
							return ( index/*, total */ ) => {
								const offset = index % width === 0 ? width - 1 : -1;
								return index + offset;
							};
						case RIGHT:
							return ( index/*, total */ ) => {
								// If at end, switch back to start.
								const offset = index % width === width - 1 ? -width + 1 : +1;
								return index + offset;
							};
						case UP:
							return ( index, total ) => {
								const offset = -width;
								return gridConfig.cycle ? cycleValue( index, total, offset ) : index + offset;
							};
						case DOWN:
							return ( index, total ) => {
								const offset = width;
								return gridConfig.cycle ? cycleValue( index, total, offset ) : index + offset;
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
