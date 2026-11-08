import { describe, expect, it } from 'vitest';
import {
	getListViewDropTarget,
	NESTING_LEVEL_INDENTATION,
} from '../use-list-view-drop-zone';
import type { ListViewDropZoneBlock } from '../types';

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
		// The stub elements only provide the rect that the drop target reads.
	] as unknown as ListViewDropZoneBlock[];

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
				clientId: 'block-1',
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
				clientId: 'block-3',
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
				clientId: 'block-1',
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
				clientId: 'block-1',
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

	describe( 'while the drop indicator displaces the rows', () => {
		// Models the list view while a block is dragged downward: the dragged
		// block keeps its row, the rows between it and the target shift up to
		// fill its slot, and the drop indicator occupies the vacated slot, so a
		// gap opens between the target block and the block after it.
		const rect = ( top: number, bottom: number ) => ( {
			top,
			bottom,
			left: 10,
			right: 300,
			x: 10,
			y: top,
			width: 290,
			height: bottom - top,
		} );
		const displacedBlocksData = [
			{
				blockIndex: 0,
				canInsertDraggedBlocksAsChild: true,
				canInsertDraggedBlocksAsSibling: true,
				clientId: 'dragged',
				element: { getBoundingClientRect: () => rect( 50, 100 ) },
				innerBlockCount: 0,
				isDraggedBlock: true,
				isExpanded: false,
				rootClientId: '',
				nestingLevel: 1,
			},
			{
				blockIndex: 1,
				canInsertDraggedBlocksAsChild: true,
				canInsertDraggedBlocksAsSibling: true,
				clientId: 'target',
				// Shifted up into the dragged block's slot.
				element: { getBoundingClientRect: () => rect( 50, 100 ) },
				innerBlockCount: 0,
				isDraggedBlock: false,
				isExpanded: false,
				rootClientId: '',
				nestingLevel: 1,
			},
			{
				blockIndex: 2,
				canInsertDraggedBlocksAsChild: true,
				canInsertDraggedBlocksAsSibling: true,
				clientId: 'after',
				// The drop indicator sits in the 100-150 gap above this block.
				element: { getBoundingClientRect: () => rect( 150, 200 ) },
				innerBlockCount: 0,
				isDraggedBlock: false,
				isExpanded: false,
				rootClientId: '',
				nestingLevel: 1,
			},
			// The stub elements only provide the rect that the drop target reads.
		] as unknown as ListViewDropZoneBlock[];

		it( 'should keep nesting when the cursor is in the gap below the target and over the nesting indentation', () => {
			[
				{ position: { x: 250, y: 125 }, rtl: false },
				{ position: { x: 50, y: 125 }, rtl: true },
			].forEach( ( { position, rtl } ) => {
				const target = getListViewDropTarget(
					displacedBlocksData,
					position,
					rtl
				);

				expect( target ).toEqual( {
					blockIndex: 0,
					clientId: 'target',
					dropPosition: 'inside',
					rootClientId: 'target',
				} );
			} );
		} );

		it( 'should drop below the target when the cursor is in the gap but not over the nesting indentation', () => {
			[
				{ position: { x: 30, y: 125 }, rtl: false },
				{ position: { x: 270, y: 125 }, rtl: true },
			].forEach( ( { position, rtl } ) => {
				const target = getListViewDropTarget(
					displacedBlocksData,
					position,
					rtl
				);

				expect( target ).toEqual( {
					blockIndex: 2,
					clientId: 'target',
					dropPosition: 'bottom',
					rootClientId: '',
				} );
			} );
		} );

		it( "should keep nesting into the block above the dragged last block when the cursor is over the dragged block's slot", () => {
			// The dragged block is the last row; it keeps its slot while the
			// rows above do not move, so the gap below the target is the
			// dragged block's own row.
			const draggedLastBlocksData = [
				{ ...displacedBlocksData[ 1 ], blockIndex: 0 },
				{
					...displacedBlocksData[ 0 ],
					blockIndex: 1,
					// The stub element only provides the rect that the drop target reads.
					element: {
						getBoundingClientRect: () => rect( 100, 150 ),
					} as unknown as Element,
				},
			];

			[
				{ position: { x: 250, y: 125 }, rtl: false },
				{ position: { x: 50, y: 125 }, rtl: true },
			].forEach( ( { position, rtl } ) => {
				const target = getListViewDropTarget(
					draggedLastBlocksData,
					position,
					rtl
				);

				expect( target ).toEqual( {
					blockIndex: 0,
					clientId: 'target',
					dropPosition: 'inside',
					rootClientId: 'target',
				} );
			} );
		} );

		it( 'should not nest into the last block when the cursor is below it', () => {
			[
				{ position: { x: 250, y: 230 }, rtl: false },
				{ position: { x: 50, y: 230 }, rtl: true },
			].forEach( ( { position, rtl } ) => {
				const target = getListViewDropTarget(
					displacedBlocksData,
					position,
					rtl
				);

				expect( target ).toEqual( {
					blockIndex: 3,
					clientId: 'after',
					dropPosition: 'bottom',
					rootClientId: '',
				} );
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
