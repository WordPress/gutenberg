import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GridItemRotator } from '../grid-item-rotator';

let blockElement: HTMLElement | null = null;

vi.mock( import( '../../block-list/use-block-props/use-block-refs' ), () => ( {
	useBlockElement: () => blockElement,
} ) );
// The overlay's position is not under test here.
vi.mock( import( '../use-rotated-overlay-style' ), () => ( {
	useRotatedOverlayStyle: () => undefined,
} ) );
vi.mock( import( '../../block-popover/cover' ), async () => {
	const { forwardRef } = await import( '@wordpress/element' );
	return {
		default: forwardRef< HTMLDivElement, { children?: ReactNode } >(
			( { children }, ref ) => <div ref={ ref }>{ children }</div>
		),
	};
} );

// The box is not laid out, so the block's center is at 0, 0. A pointer to its
// left is a quarter turn clockwise, and one straight above it is half a turn.
const QUARTER_TURN = { clientX: -100, clientY: 0 };
const HALF_TURN = { clientX: 0, clientY: -100 };

// jsdom implements neither pointer events nor pointer capture.
class TestPointerEvent extends window.MouseEvent {
	pointerId: number;

	constructor(
		type: string,
		{ pointerId = 0, ...init }: MouseEventInit & { pointerId?: number } = {}
	) {
		super( type, init );
		this.pointerId = pointerId;
	}
}

const POINTER_CAPTURE_METHODS = {
	setPointerCapture: () => {},
	releasePointerCapture: () => {},
	hasPointerCapture: () => true,
};

function getInlineRotate() {
	return blockElement?.style.getPropertyValue( 'rotate' );
}

function renderRotator( props: { angle?: number } = {} ) {
	const onChange = vi.fn();
	const onPreview = vi.fn();
	const view = render(
		<GridItemRotator
			clientId="block"
			angle={ 0 }
			onChange={ onChange }
			onPreview={ onPreview }
			{ ...props }
		/>
	);
	const handle = screen.getByTitle( 'Rotate' );
	return { ...view, handle, onChange, onPreview };
}

describe( 'GridItemRotator', () => {
	beforeEach( () => {
		vi.stubGlobal( 'PointerEvent', TestPointerEvent );
		blockElement = document.createElement( 'div' );
		document.body.appendChild( blockElement );
		Object.assign( window.HTMLElement.prototype, POINTER_CAPTURE_METHODS );
	} );

	afterEach( () => {
		vi.unstubAllGlobals();
		blockElement?.remove();
		blockElement = null;
		for ( const method of Object.keys( POINTER_CAPTURE_METHODS ) ) {
			Reflect.deleteProperty( window.HTMLElement.prototype, method );
		}
	} );

	it( 'previews the rotation and writes it once on release', () => {
		const { handle, onChange, onPreview } = renderRotator();

		fireEvent.pointerDown( handle, { button: 0, pointerId: 1 } );
		fireEvent.pointerMove( handle, { pointerId: 1, ...QUARTER_TURN } );
		expect( getInlineRotate() ).toBe( '90deg' );
		expect( screen.getByText( '90°' ) ).toBeVisible();
		fireEvent.pointerMove( handle, { pointerId: 1, ...HALF_TURN } );
		expect( getInlineRotate() ).toBe( '180deg' );
		expect( onChange ).not.toHaveBeenCalled();

		fireEvent.pointerUp( handle, { pointerId: 1 } );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( 180 );
		expect( getInlineRotate() ).toBe( '' );
		expect( onPreview ).toHaveBeenLastCalledWith( null );
	} );

	it( 'writes nothing when the angle does not change', () => {
		const { handle, onChange } = renderRotator( { angle: 90 } );

		fireEvent.pointerDown( handle, { button: 0, pointerId: 1 } );
		fireEvent.pointerMove( handle, { pointerId: 1, ...QUARTER_TURN } );
		fireEvent.pointerUp( handle, { pointerId: 1 } );
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'cancels on Escape, claiming the key, and writes nothing', () => {
		const { handle, onChange, onPreview } = renderRotator();

		fireEvent.pointerDown( handle, { button: 0, pointerId: 1 } );
		fireEvent.pointerMove( handle, { pointerId: 1, ...QUARTER_TURN } );

		const escape = createEvent.keyDown( document.body, { key: 'Escape' } );
		fireEvent( document.body, escape );
		expect( escape.defaultPrevented ).toBe( true );
		expect( getInlineRotate() ).toBe( '' );
		expect( onPreview ).toHaveBeenLastCalledWith( null );

		fireEvent.pointerUp( handle, { pointerId: 1 } );
		expect( onChange ).not.toHaveBeenCalled();

		// Escape is no longer claimed once the rotation has ended.
		const laterEscape = createEvent.keyDown( document.body, {
			key: 'Escape',
		} );
		fireEvent( document.body, laterEscape );
		expect( laterEscape.defaultPrevented ).toBe( false );
	} );

	it( 'clears the preview when it goes away mid-rotation', () => {
		const { handle, onChange, onPreview, unmount } = renderRotator();

		fireEvent.pointerDown( handle, { button: 0, pointerId: 1 } );
		fireEvent.pointerMove( handle, { pointerId: 1, ...QUARTER_TURN } );
		expect( getInlineRotate() ).toBe( '90deg' );

		unmount();
		expect( getInlineRotate() ).toBe( '' );
		expect( onPreview ).toHaveBeenLastCalledWith( null );

		const escape = createEvent.keyDown( document.body, { key: 'Escape' } );
		fireEvent( document.body, escape );
		expect( escape.defaultPrevented ).toBe( false );
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'ignores buttons other than the main one', () => {
		const { handle, onChange } = renderRotator();

		fireEvent.pointerDown( handle, { button: 2, pointerId: 1 } );
		fireEvent.pointerMove( handle, { pointerId: 1, ...QUARTER_TURN } );
		fireEvent.pointerUp( handle, { pointerId: 1 } );
		expect( getInlineRotate() ).toBe( '' );
		expect( onChange ).not.toHaveBeenCalled();
	} );
} );
