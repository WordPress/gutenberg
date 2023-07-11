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
		[
			{ position: { x: 50, y: 70 }, rtl: false },
			{ position: { x: 250, y: 70 }, rtl: true },
		].forEach( ( { position, rtl } ) => {
			const target = getListViewDropTarget( blocksData, position, rtl );

			expect( target ).toEqual( {
				blockIndex: 0,
				clientId: 'block-1',
				dropPosition: 'top',
				rootClientId: '',
			} );
		} );
	} );

	it( 'should nest when dragging a block over the bottom half of an expanded block', () => {
		[
			{ position: { x: 50, y: 90 }, rtl: false },
			{ position: { x: 250, y: 90 }, rtl: true },
		].forEach( ( { position, rtl } ) => {
			const target = getListViewDropTarget( blocksData, position, rtl );

			expect( target ).toEqual( {
				blockIndex: 0,
				dropPosition: 'inside',
				rootClientId: 'block-1',
			} );
		} );
	} );

	it( 'should nest when dragging a block over the right side of the bottom half of a block nested to three levels', () => {
		[
			{ position: { x: 250, y: 180 }, rtl: false },
			{ position: { x: 50, y: 180 }, rtl: true },
		].forEach( ( { position, rtl } ) => {
			const target = getListViewDropTarget( blocksData, position, rtl );

			expect( target ).toEqual( {
				blockIndex: 0,
				dropPosition: 'inside',
				rootClientId: 'block-3',
			} );
		} );
	} );

	it( 'should drag below when positioned at the bottom half of a block nested to three levels, and over the third level horizontally', () => {
		[
			{
				position: { x: 10 + NESTING_LEVEL_INDENTATION * 3, y: 180 },
				rtl: false,
			},
			{
				position: { x: 300 - NESTING_LEVEL_INDENTATION * 3, y: 180 },
				rtl: true,
			},
		].forEach( ( { position, rtl } ) => {
			const target = getListViewDropTarget( blocksData, position, rtl );

			expect( target ).toEqual( {
				blockIndex: 1,
				clientId: 'block-3',
				dropPosition: 'bottom',
				rootClientId: 'block-2',
			} );
		} );
	} );

	it( 'should drag one level up when positioned at the bottom half of a block nested to three levels, and over the second level horizontally', () => {
		[
			{
				position: { x: 10 + NESTING_LEVEL_INDENTATION * 2, y: 180 },
				rtl: false,
			},
			{
				position: { x: 300 - NESTING_LEVEL_INDENTATION * 2, y: 180 },
				rtl: true,
			},
		].forEach( ( { position, rtl } ) => {
			const target = getListViewDropTarget( blocksData, position, rtl );

			expect( target ).toEqual( {
				blockIndex: 1,
				clientId: 'block-3',
				dropPosition: 'bottom',
				rootClientId: 'block-1',
			} );
		} );
	} );

	it( 'should drag two levels up below when positioned at the bottom half of a block nested to three levels, and over the first level horizontally', () => {
		[
			{
				position: { x: 10 + NESTING_LEVEL_INDENTATION, y: 180 },
				rtl: false,
			},
			{
				position: { x: 300 - NESTING_LEVEL_INDENTATION, y: 180 },
				rtl: true,
			},
		].forEach( ( { position, rtl } ) => {
			const target = getListViewDropTarget( blocksData, position, rtl );

			expect( target ).toEqual( {
				blockIndex: 1,
				clientId: 'block-3',
				dropPosition: 'bottom',
				rootClientId: '',
			} );
		} );
	} );

	it( 'should nest and append to end when dragging a block over the right side and bottom half of a collapsed block with children', () => {
		const collapsedBlockData = [ ...blocksData ];

		// Set the first block to be collapsed.
		collapsedBlockData[ 0 ] = {
			...collapsedBlockData[ 0 ],
			isExpanded: false,
		};

		// Hide the first block's children.
		collapsedBlockData.splice( 1, 1 );

		[
			{
				position: { x: 250, y: 90 },
				rtl: false,
			},
			{
				position: { x: 50, y: 90 },
				rtl: true,
			},
		].forEach( ( { position, rtl } ) => {
			const target = getListViewDropTarget(
				collapsedBlockData,
				position,
				rtl
			);

			expect( target ).toEqual( {
				blockIndex: 1,
				dropPosition: 'inside',
				rootClientId: 'block-1',
			} );
		} );
	} );

	it( 'should nest and prepend when dragging a block over the right side and bottom half of an expanded block with children', () => {
		const collapsedBlockData = [ ...blocksData ];

		// Set the first block to be expanded.
		collapsedBlockData[ 0 ] = {
			...collapsedBlockData[ 0 ],
			isExpanded: true,
		};

		[
			{
				position: { x: 250, y: 90 },
				rtl: false,
			},
			{
				position: { x: 50, y: 90 },
				rtl: true,
			},
		].forEach( ( { position, rtl } ) => {
			const target = getListViewDropTarget(
				collapsedBlockData,
				position,
				rtl
			);

			expect( target ).toEqual( {
				blockIndex: 0,
				dropPosition: 'inside',
				rootClientId: 'block-1',
			} );
		} );
	} );

	it( 'should drag below when dragging a block over the left side and bottom half of a collapsed block with children', () => {
		const collapsedBlockData = [ ...blocksData ];

		// Set the first block to be collapsed.
		collapsedBlockData[ 0 ] = {
			...collapsedBlockData[ 0 ],
			isExpanded: false,
		};

		// Hide the first block's children.
		collapsedBlockData.splice( 1, 1 );

		[
			{
				position: { x: 30, y: 90 },
				rtl: false,
			},
			{
				position: { x: 270, y: 90 },
				rtl: true,
			},
		].forEach( ( { position, rtl } ) => {
			const target = getListViewDropTarget(
				collapsedBlockData,
				position,
				rtl
			);

			expect( target ).toEqual( {
				blockIndex: 1,
				clientId: 'block-1',
				dropPosition: 'bottom',
				rootClientId: '',
			} );
		} );
	} );

	it( 'should drag below when attempting to nest but the dragged block is not allowed as a child', () => {
		const childNotAllowedBlockData = [ ...blocksData ];

		// Set the first block to not be allowed as a child.
		childNotAllowedBlockData[ 0 ] = {
			...childNotAllowedBlockData[ 0 ],
			canInsertDraggedBlocksAsChild: false,
		};

		[
			{
				position: { x: 70, y: 90 },
				rtl: false,
			},
			{
				position: { x: 230, y: 90 },
				rtl: true,
			},
		].forEach( ( { position, rtl } ) => {
			const target = getListViewDropTarget(
				childNotAllowedBlockData,
				position,
				rtl
			);

			expect( target ).toEqual( {
				blockIndex: 1,
				clientId: 'block-1',
				dropPosition: 'bottom',
				rootClientId: '',
			} );
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

	it( 'should move below, and not nest when dragging lower than the bottom-most block', () => {
		const singleBlock = [ { ...blocksData[ 0 ], innerBlockCount: 0 } ];

		// This position is to the right of the block, but below the bottom of the block.
		// This should result in the block being moved below the bottom-most block, and
		// not being treated as a nesting gesture.
		[
			{ position: { x: 160, y: 250 }, rtl: false },
			{ position: { x: 140, y: 250 }, rtl: true },
		].forEach( ( { position, rtl } ) => {
			const target = getListViewDropTarget( singleBlock, position, rtl );

			expect( target ).toEqual( {
				blockIndex: 1,
				clientId: 'block-1',
				dropPosition: 'bottom',
				rootClientId: '',
			} );
		} );
	} );
} );
