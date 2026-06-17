/**
 * External dependencies
 */
import { render, screen, fireEvent, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { RectangleStencil } from '../rectangle-stencil';
import type { NormalizedRect, Size } from '../../../../core/types';
import { DEFAULT_KEYBOARD_STEP } from '../../../../core/constants';

const DEFAULT_CROP_RECT: NormalizedRect = {
	x: 0.1,
	y: 0.1,
	width: 0.8,
	height: 0.8,
};
const CONTAINER_SIZE: Size = { width: 600, height: 400 };
const IMAGE_SIZE: Size = { width: 500, height: 300 };
const CROP_BOUNDS = { minX: 0, minY: 0, maxX: 1, maxY: 1 };

/**
 * Render a RectangleStencil in freeform mode with sensible defaults.
 * Returns the mock callbacks; use `screen` for DOM queries.
 *
 * @param overrides Props to override on the rendered stencil.
 */
function renderStencil(
	overrides: Partial< React.ComponentProps< typeof RectangleStencil > > = {}
) {
	const onCropChange = jest.fn();
	const onResizeStart = jest.fn();
	const onResizeEnd = jest.fn();
	const onEscape = jest.fn();

	render(
		<RectangleStencil
			cropRect={ DEFAULT_CROP_RECT }
			containerSize={ CONTAINER_SIZE }
			imageSize={ IMAGE_SIZE }
			onCropChange={ onCropChange }
			onResizeStart={ onResizeStart }
			onResizeEnd={ onResizeEnd }
			onEscape={ onEscape }
			freeformCrop
			cropBounds={ CROP_BOUNDS }
			{ ...overrides }
		/>
	);

	return { onCropChange, onResizeStart, onResizeEnd, onEscape };
}

describe( 'RectangleStencil', () => {
	// jsdom does not implement PointerEvent or pointer capture — stub both so
	// handle drag tests work. Same pattern as core/test/interaction-controller.ts.
	beforeAll( () => {
		if ( ! HTMLElement.prototype.setPointerCapture ) {
			HTMLElement.prototype.setPointerCapture = jest.fn();
		}
		if ( ! HTMLElement.prototype.releasePointerCapture ) {
			HTMLElement.prototype.releasePointerCapture = jest.fn();
		}
		// Without a PointerEvent constructor, fireEvent.pointerDown falls back to
		// the base Event class which has no `button` property. The stencil's
		// handler guards on `event.button !== 0` and returns early, so no native
		// listeners are ever registered. Providing a minimal stub (extending
		// MouseEvent so `button` comes from MouseEventInit) fixes this.
		if ( typeof ( globalThis as any ).PointerEvent === 'undefined' ) {
			( globalThis as any ).PointerEvent = class PointerEvent extends (
				MouseEvent
			) {
				pointerId: number;
				constructor( type: string, init: PointerEventInit = {} ) {
					super( type, init );
					this.pointerId = init.pointerId ?? 0;
				}
			};
		}
	} );

	describe( 'tab order', () => {
		it( 'renders handles clockwise from top-left in freeform mode', () => {
			renderStencil();
			const labels = screen
				.getAllByRole( 'button' )
				.map( ( b ) => b.getAttribute( 'aria-label' ) );

			expect( labels ).toEqual( [
				'Resize top-left corner',
				'Resize top edge',
				'Resize top-right corner',
				'Resize right edge',
				'Resize bottom-right corner',
				'Resize bottom edge',
				'Resize bottom-left corner',
				'Resize left edge',
			] );
		} );

		it( 'describes keyboard resizing on resize handles', () => {
			renderStencil();
			expect(
				screen.getByRole( 'button', { name: 'Resize top-left corner' } )
			).toHaveAccessibleDescription(
				'Use arrow keys to resize the crop area. Hold Shift for larger steps.'
			);
		} );

		it( 'renders corner handles clockwise from top-left when aspect ratio is locked', () => {
			renderStencil( { aspectRatio: 16 / 9 } );
			const labels = screen
				.getAllByRole( 'button' )
				.map( ( b ) => b.getAttribute( 'aria-label' ) );

			expect( labels ).toEqual( [
				'Resize top-left corner',
				'Resize top-right corner',
				'Resize bottom-right corner',
				'Resize bottom-left corner',
			] );
		} );
	} );

	describe( 'keyboard — Escape', () => {
		it( 'handles Escape on a handle without bubbling', () => {
			const onKeyDown = jest.fn();
			const onEscape = jest.fn();
			render(
				// eslint-disable-next-line jsx-a11y/no-static-element-interactions
				<div onKeyDown={ onKeyDown }>
					<RectangleStencil
						cropRect={ DEFAULT_CROP_RECT }
						containerSize={ CONTAINER_SIZE }
						imageSize={ IMAGE_SIZE }
						onCropChange={ jest.fn() }
						onEscape={ onEscape }
						freeformCrop
						cropBounds={ CROP_BOUNDS }
					/>
				</div>
			);
			const [ firstHandle ] = screen.getAllByRole( 'button' );

			fireEvent.keyDown( firstHandle, { key: 'Escape' } );

			expect( onEscape ).toHaveBeenCalledTimes( 1 );
			expect( onKeyDown ).not.toHaveBeenCalled();
		} );

		it( 'does not call onCropChange when Escape is pressed', () => {
			const { onCropChange, onEscape } = renderStencil();
			const [ firstHandle ] = screen.getAllByRole( 'button' );

			fireEvent.keyDown( firstHandle, { key: 'Escape' } );

			expect( onEscape ).toHaveBeenCalledTimes( 1 );
			expect( onCropChange ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'keyboard — arrow keys (fine step)', () => {
		it( 'calls onResizeStart once and onResizeEnd after keyboard resize settles', () => {
			jest.useFakeTimers();
			const { onResizeStart, onResizeEnd } = renderStencil();
			const eHandle = screen.getAllByRole( 'button' )[ 3 ];

			fireEvent.keyDown( eHandle, { key: 'ArrowRight' } );
			fireEvent.keyDown( eHandle, { key: 'ArrowRight' } );

			expect( onResizeStart ).toHaveBeenCalledTimes( 1 );
			expect( onResizeEnd ).not.toHaveBeenCalled();

			act( () => {
				jest.advanceTimersByTime( 500 );
			} );

			expect( onResizeEnd ).toHaveBeenCalledTimes( 1 );
			jest.useRealTimers();
		} );

		it( 'moves the right edge right by KEYBOARD_STEP on ArrowRight (no Shift)', () => {
			const { onCropChange } = renderStencil();
			// 'e' handle is the 4th button in clockwise order (nw, n, ne, e).
			const eHandle = screen.getAllByRole( 'button' )[ 3 ];

			fireEvent.keyDown( eHandle, {
				key: 'ArrowRight',
				shiftKey: false,
			} );

			expect( onCropChange ).toHaveBeenCalledTimes( 1 );
			const newRect: NormalizedRect = onCropChange.mock.calls[ 0 ][ 0 ];
			// dx = 0.01, edgeRight = 0.1 + 0.8 + 0.01 = 0.91, width = 0.81.
			expect( newRect.width ).toBeCloseTo( 0.81, 5 );
			expect( newRect.x ).toBeCloseTo( 0.1, 5 );
		} );

		it( 'moves the bottom edge down by KEYBOARD_STEP on ArrowDown (no Shift)', () => {
			const { onCropChange } = renderStencil();
			// 's' handle is the 6th button (nw, n, ne, e, se, s).
			const sHandle = screen.getAllByRole( 'button' )[ 5 ];

			fireEvent.keyDown( sHandle, {
				key: 'ArrowDown',
				shiftKey: false,
			} );

			expect( onCropChange ).toHaveBeenCalledTimes( 1 );
			const newRect: NormalizedRect = onCropChange.mock.calls[ 0 ][ 0 ];
			// dy = 0.01, edgeBottom = 0.1 + 0.8 + 0.01 = 0.91, height = 0.81.
			expect( newRect.height ).toBeCloseTo( 0.81, 5 );
			expect( newRect.y ).toBeCloseTo( 0.1, 5 );
		} );

		it( 'applies snapCropRect to freeform resize output', () => {
			const snapCropRect = jest.fn( ( rect: NormalizedRect ) => ( {
				...rect,
				width: 0.82,
			} ) );
			const { onCropChange } = renderStencil( { snapCropRect } );
			const eHandle = screen.getAllByRole( 'button' )[ 3 ];

			fireEvent.keyDown( eHandle, {
				key: 'ArrowRight',
				shiftKey: false,
			} );

			expect( snapCropRect ).toHaveBeenCalledTimes( 1 );
			expect( snapCropRect.mock.calls[ 0 ][ 0 ].width ).toBeCloseTo(
				0.81,
				5
			);
			expect( snapCropRect.mock.calls[ 0 ][ 1 ] ).toBe( 'e' );
			expect( onCropChange.mock.calls[ 0 ][ 0 ].width ).toBeCloseTo(
				0.82,
				5
			);
		} );

		it( 'shrinks a locked-ratio crop from a corner handle', () => {
			const { onCropChange } = renderStencil( {
				aspectRatio: 1,
				containerSize: { width: 500, height: 500 },
				imageSize: { width: 500, height: 500 },
			} );
			const nwHandle = screen.getByRole( 'button', {
				name: 'Resize top-left corner',
			} );

			fireEvent.keyDown( nwHandle, {
				key: 'ArrowRight',
				shiftKey: false,
			} );

			expect( onCropChange ).toHaveBeenCalledTimes( 1 );
			const newRect: NormalizedRect = onCropChange.mock.calls[ 0 ][ 0 ];
			expect( newRect.x ).toBeCloseTo(
				DEFAULT_CROP_RECT.x + DEFAULT_KEYBOARD_STEP,
				5
			);
			expect( newRect.y ).toBeCloseTo(
				DEFAULT_CROP_RECT.y + DEFAULT_KEYBOARD_STEP,
				5
			);
			expect( newRect.width ).toBeCloseTo(
				DEFAULT_CROP_RECT.width - DEFAULT_KEYBOARD_STEP,
				5
			);
			expect( newRect.height ).toBeCloseTo(
				DEFAULT_CROP_RECT.height - DEFAULT_KEYBOARD_STEP,
				5
			);
		} );
	} );

	describe( 'keyboard — arrow keys (coarse step with Shift)', () => {
		it( 'moves the right edge right by KEYBOARD_STEP_SHIFT on Shift+ArrowRight', () => {
			const { onCropChange } = renderStencil();
			const eHandle = screen.getAllByRole( 'button' )[ 3 ];

			fireEvent.keyDown( eHandle, { key: 'ArrowRight', shiftKey: true } );

			expect( onCropChange ).toHaveBeenCalledTimes( 1 );
			const newRect: NormalizedRect = onCropChange.mock.calls[ 0 ][ 0 ];
			// dx = 0.1, edgeRight = 0.1 + 0.8 + 0.1 = 1.0 (clamped to boundsMaxX=1), width = 0.9.
			expect( newRect.width ).toBeCloseTo( 0.9, 5 );
		} );

		it( 'step is 10x larger with Shift than without', () => {
			const { onCropChange } = renderStencil();
			const eHandle = screen.getAllByRole( 'button' )[ 3 ];

			fireEvent.keyDown( eHandle, {
				key: 'ArrowRight',
				shiftKey: false,
			} );
			const fineRect: NormalizedRect = onCropChange.mock.calls[ 0 ][ 0 ];
			const fineDelta = fineRect.width - DEFAULT_CROP_RECT.width;

			onCropChange.mockClear();

			fireEvent.keyDown( eHandle, { key: 'ArrowRight', shiftKey: true } );
			const coarseRect: NormalizedRect =
				onCropChange.mock.calls[ 0 ][ 0 ];
			const coarseDelta = coarseRect.width - DEFAULT_CROP_RECT.width;

			expect( coarseDelta / fineDelta ).toBeCloseTo( 10, 0 );
		} );

		it( 'does not apply snapCropRect while resizing a locked aspect ratio', () => {
			const snapCropRect = jest.fn( ( rect: NormalizedRect ) => rect );
			renderStencil( { aspectRatio: 1, snapCropRect } );
			const nwHandle = screen.getByRole( 'button', {
				name: 'Resize top-left corner',
			} );

			fireEvent.keyDown( nwHandle, {
				key: 'ArrowRight',
				shiftKey: false,
			} );

			expect( snapCropRect ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'pointer drag — focus after release', () => {
		it( 'calls onResizeStart on pointerdown and onResizeEnd on pointerup', () => {
			const { onResizeStart, onResizeEnd } = renderStencil();
			const [ firstHandle ] = screen.getAllByRole( 'button' );

			fireEvent.pointerDown( firstHandle, {
				button: 0,
				clientX: 100,
				clientY: 100,
				pointerId: 1,
			} );

			expect( onResizeStart ).toHaveBeenCalledTimes( 1 );
			expect( onResizeEnd ).not.toHaveBeenCalled();

			fireEvent.pointerUp( firstHandle, { pointerId: 1 } );

			expect( onResizeEnd ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'focuses the handle button after a pointer drag ends', () => {
			renderStencil();
			const [ firstHandle ] = screen.getAllByRole( 'button' );

			jest.spyOn( firstHandle, 'focus' );

			fireEvent.pointerDown( firstHandle, {
				button: 0,
				clientX: 100,
				clientY: 100,
				pointerId: 1,
			} );
			fireEvent.pointerUp( firstHandle, {
				pointerId: 1,
			} );

			expect( firstHandle.focus ).toHaveBeenCalled();
		} );
	} );
} );
