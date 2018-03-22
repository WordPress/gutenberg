/** @format */

export const reducer = ( state = {}, action ) => {
	switch ( action.type ) {
		case 'BLOCK_FOCUS_ACTION':
			var blocks = [ ...state.blocks ];
			const currentBlockState = blocks[ action.rowId ].focused;
			// Deselect all blocks
			for ( let block of blocks ) {
				block.focused = false;
			}
			// Select or deselect pressed block
			blocks[ action.rowId ].focused = ! currentBlockState;
			return { blocks: blocks, refresh: ! state.refresh };
		case 'BLOCK_MOVE_UP_ACTION':
			var blocks = [ ...state.blocks ];
			var tmp = blocks[ action.rowId ];
			blocks[ action.rowId ] = blocks[ action.rowId - 1 ];
			blocks[ action.rowId - 1 ] = tmp;
			return { blocks: blocks, refresh: ! state.refresh };
		case 'BLOCK_MOVE_DOWN_ACTION':
			var blocks = [ ...state.blocks ];
			var tmp = blocks[ action.rowId ];
			blocks[ action.rowId ] = blocks[ action.rowId + 1 ];
			blocks[ action.rowId + 1 ] = tmp;
			return { blocks: blocks, refresh: ! state.refresh };
		case 'BLOCK_DELETE_ACTION':
			var blocks = [ ...state.blocks ];
			blocks.splice( action.rowId, 1 );
			return { blocks: blocks, refresh: ! state.refresh };
		default:
			return state;
	}
};
