import { describe, expect, it, vi } from 'vitest';
import {
	isGridItemHandleDrag,
	startGridItemDrag,
	startGridItemPointerDrag,
	subscribeToGridItemPointerDrag,
} from '../start-grid-item-drag';

function setUp( { fromBody = false } = {} ) {
	const blockElement = document.createElement( 'div' );
	const handle = document.createElement( 'div' );
	document.body.append( blockElement, handle );
	const dataTransfer = {
		clearData: vi.fn(),
		setData: vi.fn(),
		setDragImage: vi.fn(),
	};
	const event = new window.Event( 'dragstart', {
		bubbles: true,
	} ) as Event & { dataTransfer: typeof dataTransfer };
	event.dataTransfer = dataTransfer;
	Object.defineProperty( event, 'target', {
		value: fromBody ? blockElement : handle,
	} );
	const startDraggingBlocks = vi.fn();
	const stopDraggingBlocks = vi.fn();
	// @ts-expect-error The test passes a plain event with a partial data transfer.
	startGridItemDrag( event, {
		clientId: 'block',
		rootClientId: 'grid',
		blockElement,
		startDraggingBlocks,
		stopDraggingBlocks,
		isHandle: ! fromBody,
	} );
	return {
		blockElement,
		handle,
		dataTransfer,
		startDraggingBlocks,
		stopDraggingBlocks,
	};
}

describe( 'startGridItemDrag', () => {
	it( 'sets the dragged block as the drag data', () => {
		const { dataTransfer } = setUp();
		expect( dataTransfer.setData ).toHaveBeenCalledWith(
			'wp-blocks',
			JSON.stringify( {
				type: 'block',
				srcClientIds: [ 'block' ],
				srcRootClientId: 'grid',
			} )
		);
		expect( dataTransfer.setDragImage ).toHaveBeenCalled();
	} );

	it( 'marks a drag from the handle, but not one from the body', () => {
		const { dataTransfer } = setUp();
		expect( dataTransfer.setData ).toHaveBeenCalledWith(
			'wp-grid-item-handle',
			'1'
		);
		const { dataTransfer: bodyDataTransfer } = setUp( { fromBody: true } );
		expect( bodyDataTransfer.setData ).not.toHaveBeenCalledWith(
			'wp-grid-item-handle',
			expect.anything()
		);
	} );

	it( 'dims the block and starts dragging on the first dragover', () => {
		const { blockElement, startDraggingBlocks } = setUp();
		expect( blockElement ).toHaveStyle( { opacity: '0.5' } );
		expect( startDraggingBlocks ).not.toHaveBeenCalled();
		document.dispatchEvent( new window.Event( 'dragover' ) );
		document.dispatchEvent( new window.Event( 'dragover' ) );
		expect( startDraggingBlocks ).toHaveBeenCalledTimes( 1 );
		expect( startDraggingBlocks ).toHaveBeenCalledWith( [ 'block' ] );
	} );

	it( 'ends the drag once, when the handle the drag started on gets dragend', () => {
		const { blockElement, handle, stopDraggingBlocks } = setUp();
		document.dispatchEvent( new window.Event( 'dragover' ) );
		handle.dispatchEvent(
			new window.Event( 'dragend', { bubbles: true } )
		);
		expect( stopDraggingBlocks ).toHaveBeenCalledTimes( 1 );
		expect( blockElement ).not.toHaveStyle( { opacity: '0.5' } );
		document.dispatchEvent( new window.Event( 'drop' ) );
		expect( stopDraggingBlocks ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'startGridItemPointerDrag', () => {
	it( 'tells every listener which drop layer is under the touch', () => {
		const blockElement = document.createElement( 'div' );
		const handle = document.createElement( 'div' );
		handle.setPointerCapture = vi.fn();
		const dropLayer = document.createElement( 'div' );
		dropLayer.className = 'block-editor-grid-visualizer__drop-layer';
		const elementsFromPoint = vi.fn( () => [ handle, dropLayer ] );
		document.elementsFromPoint = elementsFromPoint;
		document.body.append( blockElement, handle, dropLayer );
		const listeners = [ vi.fn(), vi.fn() ];
		const unsubscribes = listeners.map( subscribeToGridItemPointerDrag );

		startGridItemPointerDrag(
			new window.PointerEvent( 'pointerdown', { pointerId: 1 } ),
			{
				clientId: 'block',
				blockElement,
				handle,
				startDraggingBlocks: vi.fn(),
				stopDraggingBlocks: vi.fn(),
			}
		);
		document.dispatchEvent(
			new window.PointerEvent( 'pointermove', {
				pointerId: 1,
				clientX: 10,
				clientY: 20,
			} )
		);
		unsubscribes.forEach( ( unsubscribe ) => unsubscribe() );

		expect( elementsFromPoint ).toHaveBeenCalledTimes( 1 );
		for ( const listener of listeners ) {
			expect( listener ).toHaveBeenCalledWith( {
				type: 'move',
				clientX: 10,
				clientY: 20,
				dropLayer,
			} );
		}
	} );
} );

describe( 'isGridItemHandleDrag', () => {
	it( 'reads the mark from the drag data types', () => {
		expect(
			isGridItemHandleDrag( {
				// @ts-expect-error The test passes a partial drag event.
				dataTransfer: { types: [ 'wp-blocks', 'wp-grid-item-handle' ] },
			} )
		).toBe( true );
		expect(
			// @ts-expect-error The test passes a partial drag event.
			isGridItemHandleDrag( { dataTransfer: { types: [ 'wp-blocks' ] } } )
		).toBe( false );
		// @ts-expect-error The test passes an event without drag data.
		expect( isGridItemHandleDrag( {} ) ).toBe( false );
	} );
} );
