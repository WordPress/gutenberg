import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { useEventHandlers } from '../use-selected-block-event-handlers';
import { store as blockEditorStore } from '../../../../store';

const CLIENT_ID = 'block-client-id';

function Block() {
	const ref = useEventHandlers( { clientId: CLIENT_ID, isSelected: true } );
	return (
		<div
			ref={ ref }
			id={ `block-${ CLIENT_ID }` }
			data-block={ CLIENT_ID }
			data-testid="block"
			tabIndex={ 0 }
			draggable
		/>
	);
}

/**
 * The drag events jsdom lacks, carrying the data transfer the hook writes
 * the dragged block to.
 *
 * @param type    Event type.
 * @param clientX Pointer x.
 * @param clientY Pointer y.
 */
function dragEvent( type: string, clientX = 0, clientY = 0 ) {
	const event = new MouseEvent( type, {
		bubbles: true,
		cancelable: true,
		clientX,
		clientY,
	} );
	Object.defineProperty( event, 'dataTransfer', {
		value: {
			types: [],
			effectAllowed: '',
			clearData: vi.fn(),
			setData: vi.fn(),
			setDragImage: vi.fn(),
		},
	} );
	return event;
}

type Drag = { node: HTMLElement; unmount: () => void };

describe( 'useEventHandlers', () => {
	afterEach( () => {
		dispatch( blockEditorStore ).stopDraggingBlocks();
		document.documentElement.classList.remove( 'is-dragging' );
		document.body.classList.remove( 'is-dragging-components-draggable' );
	} );

	it.each( [
		[
			// Dispatched at the dragged node, it bubbles to the document.
			'drag end',
			( { node }: Drag ) => node.dispatchEvent( dragEvent( 'dragend' ) ),
		],
		[
			// Mouse events are suppressed while a drag is in progress, so
			// one with the button up means the drag is over.
			'the next mouse move when drop and drag end are missed',
			() =>
				document.dispatchEvent(
					new MouseEvent( 'mousemove', { bubbles: true, buttons: 0 } )
				),
		],
		[ 'unmount during the drag', ( { unmount }: Drag ) => unmount() ],
	] )( 'lifts the block for the drag and puts it back on %s', ( _, end ) => {
		const { unmount } = render( <Block /> );
		const node = screen.getByTestId( 'block' );
		node.focus();
		node.dispatchEvent( dragEvent( 'dragstart' ) );
		// The block stops receiving pointer events once the pointer moves.
		document.dispatchEvent( dragEvent( 'dragover', 10, 10 ) );
		// A move with the button held belongs to the drag in progress.
		document.dispatchEvent(
			new MouseEvent( 'mousemove', { bubbles: true, buttons: 1 } )
		);

		/* eslint-disable jest-dom/prefer-to-have-style -- The drag sets inline styles, and toHaveStyle() is disallowed in jsdom tests. */
		expect( node ).toHaveAttribute(
			'style',
			expect.stringContaining( 'pointer-events: none' )
		);
		expect( node ).toHaveAttribute(
			'style',
			expect.stringContaining( 'transform: scale(1)' )
		);
		expect( node ).not.toHaveAttribute( 'id', `block-${ CLIENT_ID }` );
		// The id moved to a hidden placeholder clone of the block.
		expect( screen.getAllByTestId( 'block' ) ).toHaveLength( 2 );
		expect( select( blockEditorStore ).isDraggingBlocks() ).toBe( true );
		expect( document.documentElement ).toHaveClass( 'is-dragging' );

		end( { node, unmount } );

		// Every drag style is gone, leaving an empty style attribute.
		expect( node ).toHaveAttribute( 'style', '' );
		/* eslint-enable jest-dom/prefer-to-have-style */
		expect( node ).toHaveAttribute( 'id', `block-${ CLIENT_ID }` );
		expect( screen.queryAllByTestId( 'block' ).length ).toBeLessThan( 2 );
		expect( select( blockEditorStore ).isDraggingBlocks() ).toBe( false );
		expect( document.documentElement ).not.toHaveClass( 'is-dragging' );
		expect( document.body ).not.toHaveClass(
			'is-dragging-components-draggable'
		);
	} );
} );
