/**
 * External dependencies
 */
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Cropper } from '../cropper';
import type { UseCropperStateReturn } from '../../hooks/use-cropper-state';
import { DEFAULT_STATE } from '../../../core/constants';

const GRID_TEST_ID = 'cropper-grid';
const GRID_INTERACTIVE_CLASS =
	'wp-media-editor-image-editor__canvas--grid-interactive';
const SHOW_GRID_CLASS = 'wp-media-editor-image-editor__canvas--show-grid';

function createController(): UseCropperStateReturn {
	return {
		state: {
			...DEFAULT_STATE,
			image: {
				src: 'test.jpg',
				naturalWidth: 600,
				naturalHeight: 400,
			},
		},
		setImage: jest.fn(),
		setPan: jest.fn(),
		setZoom: jest.fn(),
		setZoomAtPoint: jest.fn(),
		setRotation: jest.fn(),
		setFlip: jest.fn(),
		snapRotate90: jest.fn(),
		setCropRect: jest.fn(),
		settleCrop: jest.fn(),
		applyOperation: jest.fn(),
		reset: jest.fn(),
		isDirty: false,
		hasUndo: false,
		hasRedo: false,
		undo: jest.fn(),
		redo: jest.fn(),
		commitHistory: jest.fn(),
		getCroppedImage: jest.fn(),
	};
}

describe( 'Cropper', () => {
	const originalResizeObserver = globalThis.ResizeObserver;

	beforeAll( () => {
		if ( ! HTMLElement.prototype.setPointerCapture ) {
			HTMLElement.prototype.setPointerCapture = jest.fn();
		}
		if ( ! HTMLElement.prototype.releasePointerCapture ) {
			HTMLElement.prototype.releasePointerCapture = jest.fn();
		}
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

		globalThis.ResizeObserver = class ResizeObserver {
			private callback: ResizeObserverCallback;

			constructor( callback: ResizeObserverCallback ) {
				this.callback = callback;
			}

			observe() {
				this.callback(
					[
						{
							contentRect: { width: 600, height: 400 },
						} as ResizeObserverEntry,
					],
					this
				);
			}

			unobserve() {}

			disconnect() {}
		} as typeof ResizeObserver;
	} );

	afterAll( () => {
		globalThis.ResizeObserver = originalResizeObserver;
	} );

	it( 'does not render the grid when showGrid is false', () => {
		render(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showGrid={ false }
				showDimming={ false }
			/>
		);

		expect( screen.queryByTestId( GRID_TEST_ID ) ).not.toBeInTheDocument();
	} );

	it( 'renders the grid always visible when showGrid is true', async () => {
		render(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showGrid
				showDimming={ false }
			/>
		);

		await screen.findByTestId( GRID_TEST_ID );

		const canvas = screen.getByRole( 'group', { name: 'Crop area' } );
		expect( canvas ).not.toHaveClass( GRID_INTERACTIVE_CLASS );
		expect( canvas ).not.toHaveClass( SHOW_GRID_CLASS );
	} );

	it( 'describes and focuses the crop area when requested', () => {
		render(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showDimming={ false }
				focusOnMount
			/>
		);

		const canvas = screen.getByRole( 'group', { name: 'Crop area' } );
		expect( canvas ).toHaveAccessibleDescription(
			'When this area is focused, use arrow keys to move the image and plus or minus to zoom. Tab to resize handles and controls.'
		);
		expect( canvas ).toHaveFocus();
	} );

	it( 'does not expose crop area keyboard hints while resize handles are focused', async () => {
		render(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showDimming={ false }
				freeformCrop
				focusOnMount
			/>
		);

		const canvas = screen.getByRole( 'group', { name: 'Crop area' } );
		const handle = await screen.findByRole( 'button', {
			name: 'Resize top-left corner',
		} );

		fireEvent.blur( canvas, { relatedTarget: handle } );
		fireEvent.focus( handle );

		expect( canvas ).not.toHaveAccessibleDescription(
			'When this area is focused, use arrow keys to move the image and plus or minus to zoom. Tab to resize handles and controls.'
		);
		expect( handle ).toHaveAccessibleDescription(
			'Use arrow keys to resize the crop area. Hold Shift for larger steps.'
		);
	} );

	it( 'clears the keyboard-active class when a pointer drag starts on a handle', async () => {
		render(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showDimming={ false }
				freeformCrop
				focusOnMount
			/>
		);

		const canvas = screen.getByRole( 'group', { name: 'Crop area' } );
		const handle = await screen.findByRole( 'button', {
			name: 'Resize top-left corner',
		} );
		const focusVisibleClass =
			'wp-media-editor-image-editor__canvas--focus-visible';

		// Simulate keyboard resize on a handle — the canvas should pick up
		// the keyboard-active class via the capture-phase keydown listener.
		act( () => {
			handle.focus();
		} );
		fireEvent.keyDown( handle, { key: 'ArrowRight' } );
		expect( canvas ).toHaveClass( focusVisibleClass );

		// Switching to the mouse on the same handle must drop the
		// keyboard-active state, even though the handle's pointerdown
		// handler calls stopPropagation.
		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );
		expect( canvas ).not.toHaveClass( focusVisibleClass );

		fireEvent.pointerUp( handle, { pointerId: 1 } );
	} );

	it( 'returns focus to the crop area on Escape from a resize handle', async () => {
		render(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showDimming={ false }
				freeformCrop
				focusOnMount
			/>
		);

		const canvas = screen.getByRole( 'group', { name: 'Crop area' } );
		const handle = await screen.findByRole( 'button', {
			name: 'Resize top-left corner',
		} );

		act( () => {
			handle.focus();
		} );
		fireEvent.keyDown( handle, { key: 'Escape' } );

		expect( canvas ).toHaveFocus();
	} );

	it( 'renders the grid hidden by default in interactive mode', async () => {
		render(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showGrid="interactive"
				showDimming={ false }
			/>
		);

		await screen.findByTestId( GRID_TEST_ID );

		const canvas = screen.getByRole( 'group', { name: 'Crop area' } );
		expect( canvas ).toHaveClass( GRID_INTERACTIVE_CLASS );
		expect( canvas ).not.toHaveClass( SHOW_GRID_CLASS );
	} );

	it( 'shows the interactive grid when a placement control is active', async () => {
		render(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showGrid="interactive"
				showDimming={ false }
				isPlacementActive
			/>
		);

		await screen.findByTestId( GRID_TEST_ID );

		const canvas = screen.getByRole( 'group', { name: 'Crop area' } );
		expect( canvas ).toHaveClass( GRID_INTERACTIVE_CLASS );
		expect( canvas ).toHaveClass( SHOW_GRID_CLASS );
	} );

	it( 'preserves a free crop when freeform handles are toggled off', async () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			cropRect: { x: 0.1, y: 0.2, width: 0.5, height: 0.4 },
		};
		const { rerender } = render(
			<Cropper
				src="test.jpg"
				controller={ controller }
				showDimming={ false }
				freeformCrop
			/>
		);

		await screen.findByRole( 'button', {
			name: 'Resize top-left corner',
		} );
		( controller.setCropRect as jest.Mock ).mockClear();

		rerender(
			<Cropper
				src="test.jpg"
				controller={ controller }
				showDimming={ false }
				freeformCrop={ false }
			/>
		);

		expect(
			screen.queryByRole( 'button', {
				name: 'Resize top-left corner',
			} )
		).not.toBeInTheDocument();
		expect( controller.setCropRect ).not.toHaveBeenCalled();
	} );

	it( 'centers a fixed-ratio crop when freeform handles are off', async () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			cropRect: { x: 0.1, y: 0.2, width: 0.5, height: 0.4 },
		};
		render(
			<Cropper
				src="test.jpg"
				controller={ controller }
				showDimming={ false }
				freeformCrop={ false }
				aspectRatio={ 1 }
			/>
		);

		await waitFor( () =>
			expect( controller.setCropRect ).toHaveBeenCalledWith( {
				x: expect.closeTo( 1 / 6, 5 ),
				y: 0,
				width: expect.closeTo( 2 / 3, 5 ),
				height: 1,
			} )
		);
	} );

	it( 'clears settling state when a new resize starts before the settle timer fires', async () => {
		jest.useFakeTimers();

		render(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showDimming={ false }
				freeformCrop
			/>
		);

		const handle = await screen.findByRole( 'button', {
			name: 'Resize top-left corner',
		} );
		// The settle transition and viewport pan live on the stage, not the
		// canvas (which stays fixed so the root background is never exposed).
		const stage = screen.getByTestId( 'cropper-stage' );

		// Start and end a resize to trigger the settle animation.
		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );
		fireEvent.pointerUp( handle, { pointerId: 1 } );

		// The settle transition should now be active on the stage.
		expect( stage ).toHaveStyle( 'transition: transform 200ms ease-out' );

		// Start a new resize before the 200 ms settle timer fires.
		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );

		// Settling must be cleared — no transition on the drag.
		expect( stage ).not.toHaveStyle(
			'transition: transform 200ms ease-out'
		);

		// Advance past the old settle timer; it was cancelled so the stage
		// should still have no transition.
		act( () => jest.advanceTimersByTime( 200 ) );
		expect( stage ).not.toHaveStyle(
			'transition: transform 200ms ease-out'
		);

		fireEvent.pointerUp( handle, { pointerId: 1 } );

		jest.useRealTimers();
	} );

	it( 'pans the canvas when a keyboard resize extends the crop past the canvas edge', async () => {
		jest.useFakeTimers();

		// zoom: 2 so the image bounds extend past [0, 1] in normalized space,
		// allowing the crop to be resized beyond the canvas edge.
		const controller = createController();
		controller.state = { ...controller.state, zoom: 2 };

		render(
			<Cropper
				src="test.jpg"
				controller={ controller }
				showDimming={ false }
				freeformCrop
			/>
		);

		// East handle (4th button clockwise: nw, n, ne, e).
		const eHandle = await screen.findByRole( 'button', {
			name: 'Resize right edge',
		} );
		const stage = screen.getByTestId( 'cropper-stage' );

		// cropRect starts at {x:0, y:0, width:1, height:1} (right edge = 1.0).
		// One ArrowRight step (+0.01 normalized) puts the right edge at 1.01.
		// With canvasSize=600×400 and visualSize=600×400:
		//   rightOverflow = 1.01 * 600 − 600 = 6 → pan.x = −6
		fireEvent.keyDown( eHandle, { key: 'ArrowRight' } );

		expect( stage ).toHaveStyle( 'transform: translate(-6px, 0px)' );

		jest.useRealTimers();
	} );

	it( 'ignores wheel zoom while a crop resize is active', async () => {
		const controller = createController();
		render(
			<Cropper
				src="test.jpg"
				controller={ controller }
				showDimming={ false }
				freeformCrop
			/>
		);

		const resizeHandle = await screen.findByRole( 'button', {
			name: 'Resize top-left corner',
		} );
		const canvas = screen.getByRole( 'group', { name: 'Crop area' } );

		fireEvent.pointerDown( resizeHandle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );

		const wheelEvent = new WheelEvent( 'wheel', {
			bubbles: true,
			cancelable: true,
			clientX: 300,
			clientY: 200,
			deltaY: -100,
		} );
		fireEvent( canvas, wheelEvent );

		expect( wheelEvent.defaultPrevented ).toBe( true );
		expect( controller.setZoom ).not.toHaveBeenCalled();
		expect( controller.setZoomAtPoint ).not.toHaveBeenCalled();

		fireEvent.pointerUp( resizeHandle, { pointerId: 1 } );
	} );
} );
