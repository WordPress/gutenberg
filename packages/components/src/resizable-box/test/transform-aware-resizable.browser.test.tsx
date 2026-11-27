import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import ResizableBox from '..';
import { measureGain } from '../utils';

vi.mock( import( '../utils' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return { ...actual, measureGain: vi.fn( actual.measureGain ) };
} );

function nextFrame() {
	return new Promise( ( resolve ) => requestAnimationFrame( resolve ) );
}

function getBottomHandle( container: HTMLElement ) {
	return container.querySelector(
		'.components-resizable-box__side-handle.components-resizable-box__handle-bottom'
	) as HTMLElement;
}

async function dragBottomHandle(
	container: HTMLElement,
	deltaX: number,
	deltaY: number
) {
	const handle = getBottomHandle( container );
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
	return end;
}

// The stylesheet isn't loaded, so place the handle on the box's bottom edge
// the way it is in the editor.
function placeBottomHandle() {
	const style = document.createElement( 'style' );
	style.textContent =
		'.components-resizable-box__handle-bottom { bottom: 0; left: 0; width: 100%; }';
	document.head.append( style );
	onTestFinished( () => style.remove() );
}

async function renderBox( style?: React.CSSProperties ) {
	const onResizeStop = vi.fn();
	const { container } = await render(
		<div style={ { padding: 200, ...style } }>
			<ResizableBox
				defaultSize={ { width: 200, height: 200 } }
				onResizeStop={ onResizeStop }
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

	it( 'keeps following the pointer after one low gain inside a growing rotated parent', async () => {
		placeBottomHandle();
		// Like a centred image that re-centres a render late.
		vi.mocked( measureGain ).mockReturnValueOnce( 0 );
		const { container } = await renderBox( { rotate: '90deg' } );
		const end = await dragBottomHandle( container, -60, 0 );
		const handle = getBottomHandle( container ).getBoundingClientRect();
		expect(
			Math.abs( handle.x + handle.width / 2 - end.clientX )
		).toBeLessThanOrEqual( 2 );
	} );
} );
