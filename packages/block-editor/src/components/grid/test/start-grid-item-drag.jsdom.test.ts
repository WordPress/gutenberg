import { describe, expect, it, vi } from 'vitest';
import { startGridItemDrag } from '../start-grid-item-drag';

function setUp() {
	const blockElement = document.createElement( 'div' );
	document.body.append( blockElement );
	const dataTransfer = {
		clearData: vi.fn(),
		setData: vi.fn(),
		setDragImage: vi.fn(),
	};
	const event = new window.Event( 'dragstart', {
		bubbles: true,
	} ) as Event & { dataTransfer: typeof dataTransfer };
	event.dataTransfer = dataTransfer;
	Object.defineProperty( event, 'target', { value: blockElement } );
	const startDraggingBlocks = vi.fn();
	const stopDraggingBlocks = vi.fn();
	// @ts-expect-error The test passes a plain event with a partial data transfer.
	startGridItemDrag( event, {
		clientId: 'block',
		rootClientId: 'grid',
		blockElement,
		startDraggingBlocks,
		stopDraggingBlocks,
	} );
	return {
		blockElement,
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

	it( 'stops dragging once on dragend', () => {
		const { blockElement, stopDraggingBlocks } = setUp();
		document.dispatchEvent( new window.Event( 'dragover' ) );
		blockElement.dispatchEvent(
			new window.Event( 'dragend', { bubbles: true } )
		);
		expect( stopDraggingBlocks ).toHaveBeenCalledTimes( 1 );
		expect( blockElement ).not.toHaveStyle( { opacity: '0.5' } );
		document.dispatchEvent( new window.Event( 'drop' ) );
		expect( stopDraggingBlocks ).toHaveBeenCalledTimes( 1 );
	} );
} );
