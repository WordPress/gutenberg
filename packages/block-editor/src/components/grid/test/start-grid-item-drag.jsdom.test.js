import { describe, expect, it, vi } from 'vitest';
import { startGridItemDrag } from '../start-grid-item-drag';

function setUp() {
	const blockElement = document.createElement( 'div' );
	const handle = document.createElement( 'div' );
	document.body.append( blockElement, handle );
	const dataTransfer = {
		clearData: vi.fn(),
		setData: vi.fn(),
		setDragImage: vi.fn(),
	};
	const event = new window.Event( 'dragstart', { bubbles: true } );
	event.dataTransfer = dataTransfer;
	Object.defineProperty( event, 'target', { value: handle } );
	const startDraggingBlocks = vi.fn();
	const stopDraggingBlocks = vi.fn();
	startGridItemDrag( event, {
		clientId: 'block',
		rootClientId: 'grid',
		blockElement,
		startDraggingBlocks,
		stopDraggingBlocks,
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
