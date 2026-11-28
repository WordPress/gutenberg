import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { screen, waitFor, within } from '@testing-library/react';
import type { MouseEventHandler, ReactElement, ReactNode } from 'react';
import { dispatch } from '@wordpress/data';
import Iframe from '../';
import { store as blockEditorStore } from '../../../store';

/**
 * Clicks inside the canvas, from the canvas realm.
 *
 * A click driven through the Playwright provider would be positioned against
 * the parent viewport, which does not address the iframe's own.
 *
 * @param element Element inside the iframe document to click.
 * @param clientX Horizontal position within the iframe's viewport.
 * @param clientY Vertical position within the iframe's viewport.
 */
function clickInCanvas( element: Element, clientX = 0, clientY = 0 ) {
	const canvasWindow = element.ownerDocument.defaultView!;
	element.dispatchEvent(
		new canvasWindow.PointerEvent( 'click', {
			bubbles: true,
			composed: true,
			clientX,
			clientY,
		} )
	);
}

/**
 * Renders a canvas holding a button, and waits for the iframe to load it.
 *
 * @param wrap Wraps the canvas in the tree the bubbled event should reach.
 */
async function renderCanvas(
	wrap: ( canvas: ReactNode ) => ReactElement = ( canvas ) => <>{ canvas }</>
) {
	await render(
		wrap(
			<Iframe>
				<button type="button">Canvas button</button>
			</Iframe>
		)
	);
	const frame: HTMLIFrameElement = screen.getByTitle( 'Editor canvas' );
	const button = await waitFor( () =>
		within( frame.contentDocument!.documentElement ).getByRole( 'button', {
			name: 'Canvas button',
		} )
	);

	return { frame, button };
}

describe( 'Iframe', () => {
	beforeEach( () => {
		dispatch( blockEditorStore ).updateSettings( {
			__internalIsInitialized: true,
			__unstableResolvedAssets: { styles: '', scripts: '' },
		} );
	} );

	it( 'redispatches a canvas click on the iframe element', async () => {
		const { frame, button } = await renderCanvas();
		const onClick = vi.fn();
		frame.addEventListener( 'click', onClick );

		clickInCanvas( button, 10, 20 );

		expect( onClick ).toHaveBeenCalledTimes( 1 );
		// The copy carries the canvas position, so a listener outside the
		// canvas reads the coordinates against its own viewport.
		const { left, top } = frame.getBoundingClientRect();
		const [ event ] = onClick.mock.calls[ 0 ] as [ MouseEvent ];
		expect( event.clientX ).toBe( 10 + left );
		expect( event.clientY ).toBe( 20 + top );
	} );

	it( 'calls a React click handler outside the canvas once', async () => {
		const onClick = vi.fn();
		const { frame, button } = await renderCanvas( ( canvas ) => (
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- A plain parent listener is the behavior under test.
			<div onClick={ onClick }>{ canvas }</div>
		) );

		clickInCanvas( button );

		// The click arrives twice: as the React portal bubble, and as the copy
		// redispatched on the iframe. Only the copy reaches the handler.
		expect( onClick ).toHaveBeenCalledTimes( 1 );
		expect( onClick.mock.calls[ 0 ][ 0 ].target ).toBe( frame );
	} );

	it( 'forwards mouse movement before the canvas handles it', async () => {
		const order: string[] = [];
		const onMouseMove = vi.fn< MouseEventHandler< HTMLDivElement > >(
			( event ) => {
				order.push( 'outer' );
				event.preventDefault();
			}
		);
		const { frame, button } = await renderCanvas( ( canvas ) => (
			<div onMouseMove={ onMouseMove }>{ canvas }</div>
		) );
		const onCanvasMouseMove = vi.fn( ( event: Event ) => {
			order.push( 'canvas' );
			return event.defaultPrevented;
		} );
		button.addEventListener( 'mousemove', onCanvasMouseMove );
		const canvasWindow = frame.contentWindow! as typeof window;
		button.dispatchEvent(
			new canvasWindow.MouseEvent( 'mousemove', {
				bubbles: true,
				cancelable: true,
				clientX: 10,
				clientY: 20,
			} )
		);

		expect( order ).toEqual( [ 'outer', 'canvas' ] );
		expect( onMouseMove ).toHaveBeenCalledTimes( 1 );
		expect( onCanvasMouseMove ).toHaveReturnedWith( true );
		const [ event ] = onMouseMove.mock.calls[ 0 ];
		const { left, top } = frame.getBoundingClientRect();
		expect( event.target ).toBe( frame );
		expect( event.clientX ).toBe( left + 10 );
		expect( event.clientY ).toBe( top + 20 );
	} );

	it( 'keeps dragover canvas-first even when the outer iframe prevents it', async () => {
		const { frame, button } = await renderCanvas();
		const onCanvasDragOver = vi.fn(
			( event: Event ) => event.defaultPrevented
		);
		frame.contentDocument!.documentElement.addEventListener(
			'dragover',
			onCanvasDragOver
		);
		const onOuterDragOver = vi.fn( ( event: Event ) =>
			event.preventDefault()
		);
		frame.addEventListener( 'dragover', onOuterDragOver );
		const canvasWindow = frame.contentWindow! as typeof window;
		const event = new canvasWindow.DragEvent( 'dragover', {
			bubbles: true,
			cancelable: true,
		} );
		button.dispatchEvent( event );

		expect( onCanvasDragOver ).toHaveBeenCalledTimes( 1 );
		expect( onCanvasDragOver ).toHaveReturnedWith( false );
		expect( onOuterDragOver ).toHaveBeenCalledTimes( 1 );
		expect( event.defaultPrevented ).toBe( true );
	} );
} );
