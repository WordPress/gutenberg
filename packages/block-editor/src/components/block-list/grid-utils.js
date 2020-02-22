/**
 * External dependencies
 */
import uuid from 'uuid/v4';

export function createInitialLayouts( grid, blockClientIds ) {
	// Hydrate grid layout, if any, with new block client IDs.
	return grid
		? grid.map( ( item, i ) => ( {
				...item,
				i: `block-${ blockClientIds[ i ] }`,
		  } ) )
		: [];
}

export function appendNewBlocks(
	nextLayout,
	lastClickedBlockAppenderId,
	prevBlockClientIds,
	blockClientIds
) {
	if (
		blockClientIds.length &&
		! prevBlockClientIds.includes(
			blockClientIds[ blockClientIds.length - 1 ]
		)
	) {
		// If a block client ID has been added, make its block's position and dimensions
		// that of the last clicked block appender, since it must be the one that added it.
		const appenderItem = nextLayout.find(
			( item ) => item.i === lastClickedBlockAppenderId
		);
		nextLayout = nextLayout
			.map( ( item ) => {
				switch ( item.i ) {
					case lastClickedBlockAppenderId:
						return {
							...appenderItem,
							i: `block-${
								blockClientIds[ blockClientIds.length - 1 ]
							}`,
						};
					case blockClientIds[ blockClientIds.length - 1 ]:
						return null;
					default:
						return item;
				}
			} )
			.filter( Boolean );
	}

	return nextLayout;
}

export function resizeOverflowingBlocks( nextLayout, nodes ) {
	const cellChanges = {};
	const itemsMap = nextLayout.reduce( ( acc, item ) => {
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
			( node.offsetHeight - 20 ) /
				( clientHeight / itemsMap[ node.id ].h )
		);
		if (
			itemsMap[ node.id ].w < minCols ||
			itemsMap[ node.id ].h < minRows
		) {
			cellChanges[ node.id ] = {
				w: Math.max( itemsMap[ node.id ].w, minCols ),
				h: Math.max( itemsMap[ node.id ].h, minRows ),
			};
		}
	}
	if ( Object.keys( cellChanges ).length ) {
		nextLayout = nextLayout.map( ( item ) =>
			cellChanges[ item.i ] ? { ...item, ...cellChanges[ item.i ] } : item
		);
	}

	return nextLayout;
}

export function cropAndFillEmptyCells( nextLayout, cols, rows ) {
	const maxRow =
		Math.max(
			rows,
			...nextLayout
				.filter( ( item ) => ! item.i.startsWith( 'empty-cell' ) )
				.map( ( item ) => item.y + item.h )
		) - 1;
	if ( nextLayout.some( ( item ) => item.y > maxRow ) ) {
		// Crop extra rows.
		nextLayout = nextLayout.filter( ( item ) => item.y <= maxRow );
	}

	const emptyCells = {};
	for (
		let col = 0;
		col <=
		Math.max( cols, ...nextLayout.map( ( item ) => item.x + item.w ) ) - 1;
		col++
	) {
		for ( let row = 0; row <= maxRow; row++ ) {
			emptyCells[ `${ col } | ${ row }` ] = true;
		}
	}
	for ( const item of nextLayout ) {
		for ( let col = item.x; col < item.x + item.w; col++ ) {
			for ( let row = item.y; row < item.y + item.h; row++ ) {
				delete emptyCells[ `${ col } | ${ row }` ];
			}
		}
	}
	if ( Object.keys( emptyCells ).length ) {
		// Fill empty cells with block appenders.
		nextLayout = [
			...nextLayout,
			...Object.keys( emptyCells ).map( ( emptyCell ) => {
				const [ col, row ] = emptyCell.split( ' | ' );
				return {
					i: `empty-cell-${ uuid() }`,
					x: Number( col ),
					y: Number( row ),
					w: 1,
					h: 1,
				};
			} ),
		];
	}

	return nextLayout;
}

export function convertEmptyCellToBlockAppender( nextLayout, newItem ) {
	if ( ! newItem.i.startsWith( 'empty-cell' ) ) {
		return nextLayout;
	}

	nextLayout = [ ...nextLayout ];
	nextLayout.splice(
		nextLayout.findIndex( ( item ) => item.i === newItem.i ),
		1,
		{ ...newItem, i: `block-appender-${ uuid() }` }
	);
	return nextLayout;
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
			(
				item,
				i
			) => `#${ gridId } > #editor-block-list__grid-content-item-${ i } {
		grid-area: ${ item.y + 1 } / ${ item.x + 1 } / ${ item.y +
				1 +
				item.h } / ${ item.x + 1 + item.w }
	}`
		)
		.join( '\n\n	' );
}
export function createGridStyleRules( gridId, grid, breakpoint, cols, rows ) {
	const maxCol =
		Math.max( cols, ...grid.map( ( item ) => item.x + item.w ) ) - 1;
	const maxRow =
		Math.max( rows, ...grid.map( ( item ) => item.y + item.h ) ) - 1;
	return `@media (min-width: ${ breakpoint }px) {
			#${ gridId } {
				grid-template-columns: repeat(${ maxCol + 1 }, 1fr);
				grid-template-rows: repeat(${ maxRow + 1 }, 1fr);
		
			}
		
			${ createGridItemsStyleRules( gridId, grid ) }
		}`;
}
