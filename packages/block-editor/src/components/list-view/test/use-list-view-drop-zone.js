/**
 * Internal dependencies
 */
import {
	getListViewDropTarget,
	NESTING_LEVEL_INDENTATION,
} from '../use-list-view-drop-zone';

describe( 'getListViewDropTarget', () => {
	const blocksData = [
		{
			blockIndex: 0,
			canInsertDraggedBlocksAsChild: true,
			canInsertDraggedBlocksAsSibling: true,
			clientId: 'block-1',
			element: {
				getBoundingClientRect: () => ( {
					top: 50,
					bottom: 100,
					left: 10,
					right: 300,
					x: 10,
					y: 50,
					width: 290,
					height: 50,
				} ),
			},
			innerBlockCount: 1,
			isDraggedBlock: false,
			isExpanded: true,
			rootClientId: '',
			nestingLevel: 1,
		},
		{
			blockIndex: 0,
			canInsertDraggedBlocksAsChild: true,
			canInsertDraggedBlocksAsSibling: true,
			clientId: 'block-2',
			element: {
				getBoundingClientRect: () => ( {
					top: 100,
					bottom: 150,
					left: 10,
					right: 300,
					x: 10,
					y: 100,
					width: 290,
					height: 50,
				} ),
			},
			innerBlockCount: 1,
			isDraggedBlock: false,
			isExpanded: true,
			rootClientId: 'block-1',
			nestingLevel: 2,
		},
		{
			blockIndex: 0,
			canInsertDraggedBlocksAsChild: true,
			canInsertDraggedBlocksAsSibling: true,
			clientId: 'block-3',
			element: {
				getBoundingClientRect: () => ( {
					top: 150,
					bottom: 200,
					left: 10,
					right: 300,
					x: 10,
					y: 150,
					width: 290,
					height: 50,
				} ),
			},
			innerBlockCount: 0,
			isDraggedBlock: false,
			isExpanded: true,
			rootClientId: 'block-2',
			nestingLevel: 3,
		},
		{
			blockIndex: 1,
			canInsertDraggedBlocksAsChild: true,
			canInsertDraggedBlocksAsSibling: true,
			clientId: 'block-4',
			element: {
				getBoundingClientRect: () => ( {
					top: 200,
					bottom: 250,
					left: 10,
					right: 300,
					x: 10,
					y: 200,
					width: 290,
					height: 50,
				} ),
			},
			innerBlockCount: 0,
			isDraggedBlock: false,
			isExpanded: false,
			rootClientId: '',
			nestingLevel: 1,
		},
	];

	it( 'should return the correct target when dragging a block over the top half of the first block', () => {
		const position = { x: 50, y: 70 };
		const target = getListViewDropTarget( blocksData, position );

		expect( target ).toEqual( {
			blockIndex: 0,
			clientId: 'block-1',
			dropPosition: 'top',
			rootClientId: '',
		} );
	} );

	it( 'should nest when dragging a block over the bottom half of an expanded block', () => {
		const position = { x: 50, y: 90 };
		const target = getListViewDropTarget( blocksData, position );

		expect( target ).toEqual( {
			blockIndex: 0,
			dropPosition: 'inside',
			rootClientId: 'block-1',
		} );
	} );

	it( 'should nest when dragging a block over the right side of the bottom half of a block nested to three levels', () => {
		const position = { x: 250, y: 180 };
		const target = getListViewDropTarget( blocksData, position );

		expect( target ).toEqual( {
			blockIndex: 0,
			dropPosition: 'inside',
			rootClientId: 'block-3',
		} );
	} );

	it( 'should drag below when positioned at the bottom half of a block nested to three levels, and over the third level horizontally', () => {
		const position = { x: 10 + NESTING_LEVEL_INDENTATION * 3, y: 180 };
		const target = getListViewDropTarget( blocksData, position );

		expect( target ).toEqual( {
			blockIndex: 1,
			clientId: 'block-3',
			dropPosition: 'bottom',
			rootClientId: 'block-2',
		} );
	} );

	it( 'should drag one level up below when positioned at the bottom half of a block nested to three levels, and over the second level horizontally', () => {
		const position = { x: 10 + NESTING_LEVEL_INDENTATION * 2, y: 180 };
		const target = getListViewDropTarget( blocksData, position );

		expect( target ).toEqual( {
			blockIndex: 1,
			clientId: 'block-3',
			dropPosition: 'bottom',
			rootClientId: 'block-1',
		} );
	} );

	it( 'should drag two levels up below when positioned at the bottom half of a block nested to three levels, and over the first level horizontally', () => {
		const position = { x: 10 + NESTING_LEVEL_INDENTATION, y: 180 };
		const target = getListViewDropTarget( blocksData, position );

		expect( target ).toEqual( {
			blockIndex: 1,
			clientId: 'block-3',
			dropPosition: 'bottom',
			rootClientId: '',
		} );
	} );

	it( 'should nest when dragging a block over the right side and bottom half of a collapsed block with children', () => {
		const position = { x: 160, y: 90 };

		const collapsedBlockData = [ ...blocksData ];

		// Set the first block to be collapsed.
		collapsedBlockData[ 0 ] = {
			...collapsedBlockData[ 0 ],
			isExpanded: false,
		};

		// Hide the first block's children.
		collapsedBlockData.splice( 1, 1 );

		const target = getListViewDropTarget( collapsedBlockData, position );

		expect( target ).toEqual( {
			blockIndex: 0,
			dropPosition: 'inside',
			rootClientId: 'block-1',
		} );
	} );

	it( 'should drag below when dragging a block over the left side and bottom half of a collapsed block with children', () => {
		const position = { x: 30, y: 90 };

		const collapsedBlockData = [ ...blocksData ];

		// Set the first block to be collapsed.
		collapsedBlockData[ 0 ] = {
			...collapsedBlockData[ 0 ],
			isExpanded: false,
		};

		// Hide the first block's children.
		collapsedBlockData.splice( 1, 1 );

		const target = getListViewDropTarget( collapsedBlockData, position );

		expect( target ).toEqual( {
			blockIndex: 1,
			clientId: 'block-1',
			dropPosition: 'bottom',
			rootClientId: '',
		} );
	} );

	it( 'should drag below when attempting to nest but the dragged block is not allowed as a child', () => {
		const position = { x: 70, y: 90 };

		const childNotAllowedBlockData = [ ...blocksData ];

		// Set the first block to not be allowed as a child.
		childNotAllowedBlockData[ 0 ] = {
			...childNotAllowedBlockData[ 0 ],
			canInsertDraggedBlocksAsChild: false,
		};

		const target = getListViewDropTarget(
			childNotAllowedBlockData,
			position
		);

		expect( target ).toEqual( {
			blockIndex: 1,
			clientId: 'block-1',
			dropPosition: 'bottom',
			rootClientId: '',
		} );
	} );

	it( 'should return undefined when the dragged block cannot be inserted as a sibling', () => {
		const position = { x: 50, y: 70 };

		const siblingNotAllowedBlockData = [ ...blocksData ];

		// Set the first block to not be allowed as a sibling.
		siblingNotAllowedBlockData[ 0 ] = {
			...siblingNotAllowedBlockData[ 0 ],
			canInsertDraggedBlocksAsSibling: false,
		};

		const target = getListViewDropTarget(
			siblingNotAllowedBlockData,
			position
		);

		expect( target ).toBeUndefined();
	} );
} );
