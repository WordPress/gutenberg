/** @format */

export const focusBlockAction = index => ( {
	type: 'BLOCK_FOCUS_ACTION',
	rowId: index,
} );

export const moveBlockUpAction = index => ( {
	type: 'BLOCK_MOVE_UP_ACTION',
	rowId: index,
} );

export const moveBlockDownAction = index => ( {
	type: 'BLOCK_MOVE_DOWN_ACTION',
	rowId: index,
} );

export const deleteBlockAction = index => ( {
	type: 'BLOCK_DELETE_ACTION',
	rowId: index,
} );
