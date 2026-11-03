import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from '@wordpress/element';
import useDropZone from '../';

describe( 'useDropZone', () => {
	const ComponentWithWrapperDropZone = () => {
		const [ dropZoneElement, setDropZoneElement ] =
			useState< HTMLDivElement | null >( null );
		const dropZoneRef = useDropZone( {
			dropZoneElement,
		} );

		return (
			<div role="main" ref={ setDropZoneElement }>
				<div role="region" ref={ dropZoneRef }>
					<div>Drop Zone</div>
				</div>
			</div>
		);
	};

	const ComponentWithoutWrapperDropZone = () => {
		const dropZoneRef = useDropZone( {} );

		return (
			<div role="main">
				<div role="region" ref={ dropZoneRef }>
					<div>Drop Zone</div>
				</div>
			</div>
		);
	};

	it( 'will attach dropzone to outer wrapper', () => {
		const { rerender } = render( <ComponentWithWrapperDropZone /> );
		// Ensure `useEffect` has run.
		rerender( <ComponentWithWrapperDropZone /> );

		expect( screen.getByRole( 'main' ) ).toHaveAttribute(
			'data-is-drop-zone'
		);
	} );

	it( 'will attach dropzone to element with dropZoneRef attached', () => {
		const { rerender } = render( <ComponentWithoutWrapperDropZone /> );
		// Ensure `useEffect` has run.
		rerender( <ComponentWithoutWrapperDropZone /> );

		expect( screen.getByRole( 'region' ) ).toHaveAttribute(
			'data-is-drop-zone'
		);
	} );
	const ComponentWithDragCallbacks = ( {
		onDragStart,
		onDragEnd,
	}: {
		onDragStart: () => void;
		onDragEnd: () => void;
	} ) => {
		const dropZoneRef = useDropZone( { onDragStart, onDragEnd } );

		return (
			<div role="main">
				<div role="region" ref={ dropZoneRef }>
					<div>Drop Zone</div>
				</div>
			</div>
		);
	};

	function renderWithDragCallbacks() {
		const onDragStart = vi.fn();
		const onDragEnd = vi.fn();
		const { rerender } = render(
			<ComponentWithDragCallbacks
				onDragStart={ onDragStart }
				onDragEnd={ onDragEnd }
			/>
		);
		// Ensure `useEffect` has run.
		rerender(
			<ComponentWithDragCallbacks
				onDragStart={ onDragStart }
				onDragEnd={ onDragEnd }
			/>
		);
		return { onDragStart, onDragEnd };
	}

	it( 'starts a drag on the first dragover in the document, without a dragenter', () => {
		const { onDragStart } = renderWithDragCallbacks();

		fireEvent.dragOver( document.body );
		fireEvent.dragOver( document.body );

		expect( onDragStart ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'ends a drag that reaches the drop zone without a dragenter on the document', () => {
		const { onDragStart, onDragEnd } = renderWithDragCallbacks();

		fireEvent.dragOver( screen.getByRole( 'region' ) );
		expect( onDragStart ).toHaveBeenCalledTimes( 1 );

		fireEvent.dragEnd( document );
		expect( onDragEnd ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not end a drag on a mousemove while a button is held', () => {
		const { onDragEnd } = renderWithDragCallbacks();

		fireEvent.dragEnter( document.body );
		fireEvent.mouseMove( document, { buttons: 1 } );
		expect( onDragEnd ).not.toHaveBeenCalled();

		fireEvent.mouseMove( document, { buttons: 0 } );
		expect( onDragEnd ).toHaveBeenCalledTimes( 1 );
	} );
} );
