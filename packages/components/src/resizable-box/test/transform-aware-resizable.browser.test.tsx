import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import ResizableBox from '..';

function nextFrame() {
	return new Promise( ( resolve ) => requestAnimationFrame( resolve ) );
}

async function dragBottomHandle(
	container: HTMLElement,
	deltaX: number,
	deltaY: number
) {
	const handle = container.querySelector(
		'.components-resizable-box__side-handle.components-resizable-box__handle-bottom'
	) as HTMLElement;
	const rect = handle.getBoundingClientRect();
	const start = {
		clientX: rect.x + rect.width / 2,
		clientY: rect.y + rect.height / 2,
	};
	const end = {
		clientX: start.clientX + deltaX,
		clientY: start.clientY + deltaY,
	};
	handle.dispatchEvent(
		new MouseEvent( 'mousedown', { ...start, bubbles: true } )
	);
	// `re-resizable` ignores moves until the resize start has rendered.
	await nextFrame();
	window.dispatchEvent( new MouseEvent( 'mousemove', end ) );
	// Let the transformed drag settle so the handle catches up.
	for ( let frame = 0; frame < 30; frame++ ) {
		await nextFrame();
	}
	window.dispatchEvent( new MouseEvent( 'mouseup', end ) );
	const after = handle.getBoundingClientRect();
	return {
		x: after.x + after.width / 2 - end.clientX,
		y: after.y + after.height / 2 - end.clientY,
	};
}

async function renderBox(
	style?: React.CSSProperties,
	boxStyle?: React.CSSProperties
) {
	const onResizeStop = vi.fn();
	const { container } = await render(
		<div style={ { padding: 200, ...style } }>
			<ResizableBox
				defaultSize={ { width: 200, height: 200 } }
				onResizeStop={ onResizeStop }
				style={ boxStyle }
			/>
		</div>
	);
	return { container, onResizeStop };
}

describe( 'TransformAwareResizable', () => {
	it( 'resizes by the pointer movement when untransformed', async () => {
		const { container, onResizeStop } = await renderBox();
		await dragBottomHandle( container, 0, 100 );
		expect( onResizeStop ).toHaveBeenCalledTimes( 1 );
		expect( onResizeStop.mock.calls[ 0 ][ 3 ].height ).toBe( 100 );
	} );

	it( 'keeps the handle under the pointer inside a rotated parent', async () => {
		const { container, onResizeStop } = await renderBox( {
			rotate: '90deg',
		} );
		await dragBottomHandle( container, -100, 0 );
		expect( onResizeStop ).toHaveBeenCalledTimes( 1 );
		expect(
			Math.abs( onResizeStop.mock.calls[ 0 ][ 3 ].height - 100 )
		).toBeLessThanOrEqual( 2 );
	} );

	it( 'keeps the handle under the pointer when a turn out of the page shortens the box', async () => {
		const { container, onResizeStop } = await renderBox( undefined, {
			rotate: 'x 80deg',
		} );
		const offset = await dragBottomHandle( container, 0, 8 );
		expect( onResizeStop ).toHaveBeenCalledTimes( 1 );
		expect( Math.abs( offset.y ) ).toBeLessThanOrEqual( 1 );
	} );
} );
