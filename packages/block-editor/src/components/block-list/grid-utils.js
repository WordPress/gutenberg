/**
 * External dependencies
 */
import uuid from 'uuid/v4';

export const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
export const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
export const MIN_ROWS = 2;

export function createInitialLayouts( grid, blockClientIds ) {
	return Object.keys( BREAKPOINTS ).reduce( ( acc, breakpoint ) => {
		// Hydrate grid layouts, if any, with new block client IDs.
		acc[ breakpoint ] =
			grid && grid[ breakpoint ] ?
				grid[ breakpoint ].map( ( item, i ) => ( {
					...item,
					i: `block-${ blockClientIds[ i ] }`,
				} ) ) :
				[];
		return acc;
	}, {} );
}

export function appendNewBlocks(
	nextLayouts,
	breakpoint,
	lastClickedBlockAppenderId,
	prevBlockClientIds,
	blockClientIds
) {
	if (
		blockClientIds.length &&
		! prevBlockClientIds.includes( blockClientIds[ blockClientIds.length - 1 ] )
	) {
		// If a block client ID has been added, make its block's position and dimensions
		// that of the last clicked block appender, since it must be the one that added it.
		const appenderItem = nextLayouts[ breakpoint ].find(
			( item ) => item.i === lastClickedBlockAppenderId
		);
		nextLayouts = Object.keys( nextLayouts ).reduce( ( acc, _breakpoint ) => {
			acc[ _breakpoint ] = nextLayouts[ _breakpoint ]
				.map( ( item ) => {
					switch ( item.i ) {
						case lastClickedBlockAppenderId:
							return {
								...appenderItem,
								i: `block-${ blockClientIds[ blockClientIds.length - 1 ] }`,
							};
						case blockClientIds[ blockClientIds.length - 1 ]:
							return null;
						default:
							return item;
					}
				} )
				.filter( Boolean );
			return acc;
		}, {} );
	}

	return nextLayouts;
}

export function resizeOverflowingBlocks( nextLayouts, breakpoint, nodes ) {
	const cellChanges = {};
	const itemsMap = nextLayouts[ breakpoint ].reduce( ( acc, item ) => {
		acc[ item.i ] = item;
		return acc;
	}, {} );

	for ( const node of Object.values( nodes ) ) {
		if ( ! itemsMap[ node.id ] ) {
			continue;
		}
		const { clientWidth, clientHeight } = node.parentNode;
		const minCols = Math.ceil(
			node.offsetWidth / ( clientWidth / itemsMap[ node.id ].w )
		);
		const minRows = Math.ceil(
			( node.offsetHeight - 20 ) / ( clientHeight / itemsMap[ node.id ].h )
		);
		if ( itemsMap[ node.id ].w < minCols || itemsMap[ node.id ].h < minRows ) {
			cellChanges[ node.id ] = {
				w: Math.max( itemsMap[ node.id ].w, minCols ),
				h: Math.max( itemsMap[ node.id ].h, minRows ),
			};
		}
	}
	if ( Object.keys( cellChanges ).length ) {
		nextLayouts = {
			...nextLayouts,
			[ breakpoint ]: nextLayouts[ breakpoint ].map( ( item ) =>
				cellChanges[ item.i ] ? { ...item, ...cellChanges[ item.i ] } : item
			),
		};
	}

	return nextLayouts;
}

export function cropAndFillEmptyCells( nextLayouts, breakpoint ) {
	const maxRow =
		Math.max(
			MIN_ROWS,
			...nextLayouts[ breakpoint ]
				.filter( ( item ) => ! item.i.startsWith( 'block-appender' ) )
				.map( ( item ) => item.y + item.h )
		) - 1;
	if ( nextLayouts[ breakpoint ].some( ( item ) => item.y > maxRow ) ) {
		// Crop extra rows.
		nextLayouts = {
			...nextLayouts,
			[ breakpoint ]: nextLayouts[ breakpoint ].filter( ( item ) => item.y <= maxRow ),
		};
	}

	const emptyCells = {};
	for (
		let col = 0;
		col <=
		Math.max(
			COLS[ breakpoint ],
			...nextLayouts[ breakpoint ].map( ( item ) => item.x + item.w )
		) -
			1;
		col++
	) {
		for ( let row = 0; row <= maxRow; row++ ) {
			emptyCells[ `${ col } | ${ row }` ] = true;
		}
	}
	for ( const item of nextLayouts[ breakpoint ] ) {
		for ( let col = item.x; col < item.x + item.w; col++ ) {
			for ( let row = item.y; row < item.y + item.h; row++ ) {
				delete emptyCells[ `${ col } | ${ row }` ];
			}
		}
	}
	if ( Object.keys( emptyCells ).length ) {
		// Fill empty cells with block appenders.
		nextLayouts = {
			...nextLayouts,
			[ breakpoint ]: [
				...nextLayouts[ breakpoint ],
				...Object.keys( emptyCells ).map( ( emptyCell ) => {
					const [ col, row ] = emptyCell.split( ' | ' );
					return {
						i: `block-appender-${ uuid() }`,
						x: Number( col ),
						y: Number( row ),
						w: 1,
						h: 1,
					};
				} ),
			],
		};
	}

	return nextLayouts;
}

export function hashGrid( grid ) {
	return Object.values( JSON.stringify( grid ) ).reduce( ( acc, char ) => {
		/* eslint-disable no-bitwise */
		acc = ( acc << 5 ) - acc + char.charCodeAt( 0 );
		return acc & acc;
		/* eslint-enable no-bitwise */
	} );
}

function createGridItemsStyleRules( gridId, items ) {
	return items
		.map(
			( item, i ) => `#${ gridId } > #editor-block-list__grid-content-item-${ i } {
		grid-area: ${ item.y + 1 } / ${ item.x + 1 } / ${ item.y + 1 + item.h } / ${ item.x +
				1 +
				item.w }
	}`
		)
		.join( '\n\n	' );
}
export function createGridStyleRules( gridId, grid ) {
	return Object.keys( grid )
		.sort( ( a, b ) => BREAKPOINTS[ a ] - BREAKPOINTS[ b ] )
		.map( ( breakpoint ) => {
			const maxCol =
				Math.max(
					COLS[ breakpoint ],
					...grid[ breakpoint ].map( ( item ) => item.x + item.w )
				) - 1;
			const maxRow =
				Math.max( MIN_ROWS, ...grid[ breakpoint ].map( ( item ) => item.y + item.h ) ) - 1;
			return `@media (min-width: ${ BREAKPOINTS[ breakpoint ] }px) {
	#${ gridId } {
		grid-template-columns: repeat(${ maxCol + 1 }, 1fr);
		grid-template-rows: repeat(${ maxRow + 1 }, 1fr);

	}

	${ createGridItemsStyleRules( gridId, grid[ breakpoint ] ) }
}`;
		} )
		.join( '\n\n' );
}
