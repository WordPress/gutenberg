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
		default:
			return state;
	}
};
