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
import type { CropperController } from '../../hooks/use-cropper-reducer';
import { DEFAULT_STATE } from '../../../core/constants';
import { getSourceRegion } from '../../../core/source-region';

const GRID_TEST_ID = 'cropper-grid';
const GRID_INTERACTIVE_CLASS =
	'wp-media-editor-image-editor__canvas--grid-interactive';
const SHOW_GRID_CLASS = 'wp-media-editor-image-editor__canvas--show-grid';

function createController(): CropperController {
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
		toggleFlip: jest.fn(),
		snapRotate90: jest.fn(),
		setCropRect: jest.fn(),
		settleCrop: jest.fn(),
		applyOperation: jest.fn(),
		reset: jest.fn(),
		isDirty: false,
		getCroppedImage: jest.fn(),
		setVisualSize: jest.fn(),
		adjustCropRectForViewport: jest.fn(),
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
				pointerType: string;
				isPrimary: boolean;
				constructor( type: string, init: PointerEventInit = {} ) {
					super( type, init );
					this.pointerId = init.pointerId ?? 0;
					this.pointerType = init.pointerType ?? '';
					this.isPrimary = init.isPrimary ?? false;
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
		( controller.adjustCropRectForViewport as jest.Mock ).mockClear();

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
		expect( controller.adjustCropRectForViewport ).not.toHaveBeenCalled();
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
			expect( controller.adjustCropRectForViewport ).toHaveBeenCalledWith(
				{
					x: expect.closeTo( 1 / 6, 5 ),
					y: 0,
					width: expect.closeTo( 2 / 3, 5 ),
					height: 1,
				}
			)
		);
	} );

	it( 'clears settling state when a new resize starts before the settle fallback fires', async () => {
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

		// Start a new resize before the settle fallback fires.
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

		// Advance past the old settle fallback; it was cancelled so the stage
		// should still have no transition.
		act( () => jest.advanceTimersByTime( 300 ) );
		expect( stage ).not.toHaveStyle(
			'transition: transform 200ms ease-out'
		);

		fireEvent.pointerUp( handle, { pointerId: 1 } );

		jest.useRealTimers();
	} );

	it( 'keeps settling active until the settle transform transition ends', async () => {
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
		const stage = screen.getByTestId( 'cropper-stage' );

		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );
		fireEvent.pointerUp( handle, { pointerId: 1 } );

		expect( stage ).toHaveStyle( 'transition: transform 200ms ease-out' );

		act( () => jest.advanceTimersByTime( 200 ) );
		expect( stage ).toHaveStyle( 'transition: transform 200ms ease-out' );

		// The transform transition runs on the image and bubbles up to the
		// stage handler, so fire from the image to exercise the real path.
		const image = screen.getByTestId( 'cropper-image' );
		const transitionEndEvent = new Event( 'transitionend', {
			bubbles: true,
		} );
		Object.defineProperty( transitionEndEvent, 'propertyName', {
			value: 'transform',
		} );
		fireEvent( image, transitionEndEvent );

		expect( stage ).not.toHaveStyle(
			'transition: transform 200ms ease-out'
		);

		jest.useRealTimers();
	} );

	it( 'clears settling via the fallback timer when no transitionend fires', async () => {
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
		const stage = screen.getByTestId( 'cropper-stage' );

		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );
		fireEvent.pointerUp( handle, { pointerId: 1 } );

		expect( stage ).toHaveStyle( 'transition: transform 200ms ease-out' );

		// Without a transitionend, settling persists past the CSS duration...
		act( () => jest.advanceTimersByTime( 200 ) );
		expect( stage ).toHaveStyle( 'transition: transform 200ms ease-out' );

		// ...and is cleared by the fallback timer (CSS duration + 100ms).
		act( () => jest.advanceTimersByTime( 100 ) );
		expect( stage ).not.toHaveStyle(
			'transition: transform 200ms ease-out'
		);

		jest.useRealTimers();
	} );

	it( 'ignores non-transform transitionend events while settling', async () => {
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
		const stage = screen.getByTestId( 'cropper-stage' );

		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );
		fireEvent.pointerUp( handle, { pointerId: 1 } );

		expect( stage ).toHaveStyle( 'transition: transform 200ms ease-out' );

		// A stencil left/top/width/height transitionend must not clear settling.
		const stencilTransitionEnd = new Event( 'transitionend', {
			bubbles: true,
		} );
		Object.defineProperty( stencilTransitionEnd, 'propertyName', {
			value: 'left',
		} );
		fireEvent( stage, stencilTransitionEnd );

		expect( stage ).toHaveStyle( 'transition: transform 200ms ease-out' );

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
		// Pixel snapping is active at zoom:2, so one ArrowRight step is one
		// source pixel: zoom / sourceWidth = 2 / 600 normalized.
		// With canvasSize=600×400 and visualSize=600×400:
		//   rightOverflow = (1 + 2/600) * 600 − 600 = 2 → pan.x = −2
		fireEvent.keyDown( eHandle, { key: 'ArrowRight' } );

		const match = stage.style.transform.match(
			/^translate\((-?\d+(?:\.\d+)?)px, (-?\d+(?:\.\d+)?)px\)$/
		);
		expect( match ).not.toBeNull();
		expect( Number( match?.[ 1 ] ) ).toBeCloseTo( -2, 4 );
		expect( Number( match?.[ 2 ] ) ).toBeCloseTo( 0, 5 );

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

	it( 'does not start canvas drag from touch pointer events', async () => {
		const controller = createController();
		render(
			<Cropper
				src="test.jpg"
				controller={ controller }
				showDimming
				showGrid="interactive"
				freeformCrop
			/>
		);

		await screen.findByRole( 'button', {
			name: 'Resize top-left corner',
		} );
		const canvas = screen.getByRole( 'group', { name: 'Crop area' } );

		fireEvent.pointerDown( canvas, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
			pointerType: 'touch',
			isPrimary: true,
		} );
		fireEvent.pointerMove( canvas, {
			button: 0,
			clientX: 150,
			clientY: 120,
			pointerId: 1,
			pointerType: 'touch',
			isPrimary: true,
		} );

		expect( canvas ).not.toHaveClass( SHOW_GRID_CLASS );
		expect( controller.setPan ).not.toHaveBeenCalled();
	} );

	it( 'cancels handle resize when a touch gesture becomes a pinch', async () => {
		const originalRAF = globalThis.requestAnimationFrame;
		const originalCAF = globalThis.cancelAnimationFrame;
		globalThis.requestAnimationFrame = ( cb: FrameRequestCallback ) => {
			cb( 0 );
			return 0;
		};
		globalThis.cancelAnimationFrame = jest.fn();

		try {
			const controller = createController();
			const onGestureEnd = jest.fn();
			render(
				<Cropper
					src="test.jpg"
					controller={ controller }
					showDimming={ false }
					freeformCrop
					onGestureEnd={ onGestureEnd }
				/>
			);

			const resizeHandle = await screen.findByRole( 'button', {
				name: 'Resize top-left corner',
			} );
			const canvas = screen.getByRole( 'group', {
				name: 'Crop area',
			} );

			fireEvent.pointerDown( resizeHandle, {
				button: 0,
				clientX: 100,
				clientY: 100,
				pointerId: 1,
				pointerType: 'touch',
				isPrimary: true,
			} );

			( controller.setPan as jest.Mock ).mockClear();
			fireEvent.pointerDown( canvas, {
				button: 0,
				clientX: 250,
				clientY: 200,
				pointerId: 2,
				pointerType: 'touch',
				isPrimary: false,
			} );
			fireEvent.pointerMove( canvas, {
				button: 0,
				clientX: 275,
				clientY: 200,
				pointerId: 2,
				pointerType: 'touch',
				isPrimary: false,
			} );

			expect( controller.setPan ).not.toHaveBeenCalled();

			fireEvent.touchStart( canvas, {
				touches: [
					{ clientX: 250, clientY: 200 },
					{ clientX: 350, clientY: 200 },
				],
			} );

			await act( async () => {
				await Promise.resolve();
			} );

			expect( controller.settleCrop ).not.toHaveBeenCalled();
			expect( onGestureEnd ).not.toHaveBeenCalled();

			( controller.setCropRect as jest.Mock ).mockClear();
			( controller.setZoomAtPoint as jest.Mock ).mockClear();

			fireEvent.pointerMove( resizeHandle, {
				button: 0,
				clientX: 60,
				clientY: 60,
				pointerId: 1,
				pointerType: 'touch',
				isPrimary: true,
			} );
			fireEvent.touchMove( document, {
				touches: [
					{ clientX: 225, clientY: 200 },
					{ clientX: 375, clientY: 200 },
				],
			} );

			expect( controller.setCropRect ).not.toHaveBeenCalled();
			expect( controller.setZoomAtPoint ).toHaveBeenCalled();

			fireEvent.touchEnd( canvas, { touches: [] } );

			expect( onGestureEnd ).toHaveBeenCalledTimes( 1 );
		} finally {
			globalThis.requestAnimationFrame = originalRAF;
			globalThis.cancelAnimationFrame = originalCAF;
		}
	} );

	// View-scale: at rest, the scene magnifies so an under-filling crop fills
	// the canvas. Canvas is mocked at 600x400. A tall 400x1200 image contain-
	// fits to a 133.33x400 footprint (fills the height, 133px of 600 wide). A
	// square crop is bound by the footprint's 133px width, so it magnifies.
	const TALL_IMAGE = {
		src: 'tall.jpg',
		naturalWidth: 400,
		naturalHeight: 1200,
	};

	// The view-scale magnification is folded into the image's transform as a
	// leading `scale(...)`, always present (identity `scale(1)` at rest) so the
	// transform's function list stays structurally constant for transitions.
	function imageScale(): number {
		const img = screen.getByTestId< HTMLImageElement >( 'cropper-image' );
		const match = img.style.transform.match( /^scale\(\s*([\d.]+)/ );
		return match ? parseFloat( match[ 1 ] ) : 1;
	}

	function imageTransformParts(): { viewScale: number; matrix: number[] } {
		const img = screen.getByTestId< HTMLImageElement >( 'cropper-image' );
		const match = img.style.transform.match(
			/^scale\(\s*([^)]+?)\s*\)\s+matrix\(([^)]+)\)/
		);
		expect( match ).not.toBeNull();
		const [ , viewScale, matrix ] = match as RegExpMatchArray;
		return {
			viewScale: parseFloat( viewScale ),
			matrix: matrix
				.split( ',' )
				.map( ( value ) => parseFloat( value.trim() ) ),
		};
	}

	it( 'magnifies the scene so an under-filling crop fills the canvas at rest', () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			image: TALL_IMAGE,
			// Centered square crop: width fills the footprint (133px), height
			// 1/3 of 400 = 133px. On-screen 133x133, well below 0.8 * 400.
			cropRect: { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
		};
		render( <Cropper src="tall.jpg" controller={ controller } /> );

		// Footprint is 133.33x400. The square crop's binding axis (height) fills
		// to 0.8 * 400, so the image magnifies by 0.8 * 400 / 133.33 = 2.4.
		expect( imageScale() ).toBeCloseTo( 2.4, 2 );
	} );

	it( 'computes image pan from the unscaled footprint before applying view scale', () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			image: TALL_IMAGE,
			cropRect: { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
			pan: { x: 0.1, y: -0.05 },
		};
		render( <Cropper src="tall.jpg" controller={ controller } /> );

		const { viewScale, matrix } = imageTransformParts();

		expect( viewScale ).toBeCloseTo( 2.4, 2 );
		// Pan translations are produced by useTransformStyle from the unscaled
		// 133.33x400 footprint, then magnified by the leading scale(viewScale).
		// If useTransformStyle received scaledVisualSize, these would be 32 and
		// -48 instead.
		expect( matrix[ 4 ] ).toBeCloseTo( ( 400 / 3 ) * 0.1, 5 );
		expect( matrix[ 5 ] ).toBeCloseTo( 400 * -0.05, 5 );
	} );

	it( 'positions crop overlays against the magnified footprint', () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			image: TALL_IMAGE,
			cropRect: { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
		};
		render( <Cropper src="tall.jpg" controller={ controller } showGrid /> );

		expect( imageScale() ).toBeCloseTo( 2.4, 2 );

		const expectedRect = {
			left: 140,
			top: 40,
			width: 320,
			height: 320,
		};
		const expectOverlayRect = ( element: HTMLElement | null ) => {
			expect( element ).not.toBeNull();
			const overlay = element as HTMLElement;
			expect( parseFloat( overlay.style.left ) ).toBeCloseTo(
				expectedRect.left,
				1
			);
			expect( parseFloat( overlay.style.top ) ).toBeCloseTo(
				expectedRect.top,
				1
			);
			expect( parseFloat( overlay.style.width ) ).toBeCloseTo(
				expectedRect.width,
				1
			);
			expect( parseFloat( overlay.style.height ) ).toBeCloseTo(
				expectedRect.height,
				1
			);
		};

		expectOverlayRect( screen.getByTestId( 'cropper-stencil' ) );
		expectOverlayRect( screen.getByTestId( 'cropper-dimming' ) );
		expectOverlayRect( screen.getByTestId( GRID_TEST_ID ) );
	} );

	it( 'does not magnify when the crop already fills the canvas', () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			image: TALL_IMAGE,
			// Full-frame crop already fills the canvas height (footprint == 400).
			cropRect: { x: 0, y: 0, width: 1, height: 1 },
		};
		render( <Cropper src="tall.jpg" controller={ controller } /> );

		// viewScale = 1, so the leading scale is identity (no magnification).
		expect( imageScale() ).toBe( 1 );
	} );

	it( 'holds the magnified view while resizing instead of resetting the zoom', async () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			image: TALL_IMAGE,
			cropRect: { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
		};
		render(
			<Cropper src="tall.jpg" controller={ controller } freeformCrop />
		);

		// At rest the square crop magnifies the image by 2.4.
		expect( imageScale() ).toBeCloseTo( 2.4, 2 );

		const handle = await screen.findByRole( 'button', {
			name: 'Resize top-left corner',
		} );
		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );

		// Grabbing a handle must not snap the scene back to the footprint;
		// the magnification holds for the duration of the drag.
		expect( imageScale() ).toBeCloseTo( 2.4, 2 );

		fireEvent.pointerUp( handle, { pointerId: 1 } );
	} );

	it( 'snaps freeform resize output to source pixels when the image is shown at 1:1 or larger', async () => {
		const image = { src: 'tiny.png', naturalWidth: 50, naturalHeight: 50 };
		const cropRect = { x: 0.1, y: 0.12, width: 0.6, height: 0.44 };
		const controller = createController();
		controller.state = {
			...controller.state,
			image,
			cropRect,
		};
		const initialRegion = getSourceRegion(
			{ ...controller.state, cropRect },
			{ width: image.naturalWidth, height: image.naturalHeight }
		);
		render(
			<Cropper src="tiny.png" controller={ controller } freeformCrop />
		);

		const handle = await screen.findByRole( 'button', {
			name: 'Resize right edge',
		} );
		fireEvent.keyDown( handle, { key: 'ArrowRight' } );

		const rect = ( controller.setCropRect as jest.Mock ).mock
			.calls[ 0 ][ 0 ];
		const region = getSourceRegion(
			{ ...controller.state, cropRect: rect },
			{ width: image.naturalWidth, height: image.naturalHeight }
		);
		expect( region.x ).toBeCloseTo( initialRegion.x, 3 );
		expect( region.x + region.width ).toBeCloseTo(
			Math.round( region.x + region.width ),
			3
		);
		expect( rect.x ).toBeCloseTo( cropRect.x, 5 );
		expect( rect.y ).toBeCloseTo( cropRect.y, 5 );
		expect( rect.height ).toBeCloseTo( cropRect.height, 5 );
	} );

	it( 'uses source-pixel keyboard steps for horizontal freeform resize when snapping is active', async () => {
		const image = {
			src: 'wide.png',
			naturalWidth: 200,
			naturalHeight: 100,
		};
		const cropRect = { x: 0.1, y: 0.1, width: 0.6, height: 0.6 };
		const controller = createController();
		controller.state = {
			...controller.state,
			image,
			cropRect,
		};
		const initialRegion = getSourceRegion(
			{ ...controller.state, cropRect },
			{ width: image.naturalWidth, height: image.naturalHeight }
		);
		render(
			<Cropper src="wide.png" controller={ controller } freeformCrop />
		);

		const handle = await screen.findByRole( 'button', {
			name: 'Resize right edge',
		} );
		( controller.setCropRect as jest.Mock ).mockClear();
		fireEvent.keyDown( handle, { key: 'ArrowRight' } );

		const rect = ( controller.setCropRect as jest.Mock ).mock
			.calls[ 0 ][ 0 ];
		const region = getSourceRegion(
			{ ...controller.state, cropRect: rect },
			{ width: image.naturalWidth, height: image.naturalHeight }
		);
		expect( region.x + region.width ).toBeCloseTo(
			initialRegion.x + initialRegion.width + 1,
			3
		);
	} );

	it( 'keeps freeform resize smooth below 1:1 display scale', async () => {
		const image = {
			src: 'large.png',
			naturalWidth: 3333,
			naturalHeight: 3333,
		};
		const cropRect = { x: 0.113, y: 0.127, width: 0.6, height: 0.456 };
		const controller = createController();
		controller.state = {
			...controller.state,
			image,
			cropRect,
		};
		render(
			<Cropper src="large.png" controller={ controller } freeformCrop />
		);

		const handle = await screen.findByRole( 'button', {
			name: 'Resize right edge',
		} );
		fireEvent.keyDown( handle, { key: 'ArrowRight' } );

		const rect = ( controller.setCropRect as jest.Mock ).mock
			.calls[ 0 ][ 0 ];
		const region = getSourceRegion(
			{ ...controller.state, cropRect: rect },
			{ width: image.naturalWidth, height: image.naturalHeight }
		);
		expect( rect.width ).toBeCloseTo( 0.61, 5 );
		expect(
			Math.abs(
				region.x + region.width - Math.round( region.x + region.width )
			)
		).toBeGreaterThan( 0.01 );
	} );

	it( 'snaps all crop edges once when display scale reaches source-pixel size', async () => {
		const image = {
			src: 'crossing.png',
			naturalWidth: 1000,
			naturalHeight: 1000,
		};
		const cropRect = {
			x: 0.113,
			y: 0.127,
			width: 0.733,
			height: 0.641,
		};
		const controller = createController();
		controller.state = {
			...controller.state,
			image,
			cropRect,
			zoom: 0.5,
		};
		const { rerender } = render(
			<Cropper
				src="crossing.png"
				controller={ controller }
				freeformCrop
			/>
		);

		await screen.findByTestId( 'cropper-image' );
		expect( controller.setCropRect ).not.toHaveBeenCalled();

		controller.state = { ...controller.state, zoom: 3 };
		rerender(
			<Cropper
				src="crossing.png"
				controller={ controller }
				freeformCrop
			/>
		);

		await waitFor( () =>
			expect( controller.setCropRect ).toHaveBeenCalledTimes( 1 )
		);
		const rect = ( controller.setCropRect as jest.Mock ).mock
			.calls[ 0 ][ 0 ];
		const region = getSourceRegion(
			{ ...controller.state, cropRect: rect },
			{ width: image.naturalWidth, height: image.naturalHeight }
		);
		for ( const edge of [
			region.x,
			region.y,
			region.x + region.width,
			region.y + region.height,
		] ) {
			expect( edge ).toBeCloseTo( Math.round( edge ), 3 );
		}
	} );

	it( 'does not snap all crop edges for fixed-aspect freeform crops', async () => {
		const image = {
			src: 'locked-ratio.png',
			naturalWidth: 1000,
			naturalHeight: 1000,
		};
		const controller = createController();
		controller.state = {
			...controller.state,
			image,
			cropRect: {
				x: 0.113,
				y: 0.127,
				width: 0.733,
				height: 0.641,
			},
			zoom: 0.5,
		};
		const { rerender } = render(
			<Cropper
				src="locked-ratio.png"
				controller={ controller }
				freeformCrop
				aspectRatio={ 1 }
			/>
		);

		await screen.findByTestId( 'cropper-image' );
		controller.state = { ...controller.state, zoom: 3 };
		rerender(
			<Cropper
				src="locked-ratio.png"
				controller={ controller }
				freeformCrop
				aspectRatio={ 1 }
			/>
		);

		expect( controller.setCropRect ).not.toHaveBeenCalled();
	} );

	function imageRendering(): string {
		return screen.getByTestId< HTMLImageElement >( 'cropper-image' ).style
			.imageRendering;
	}

	it( 'renders upscaled (small) images pixelated so pixel boundaries stay crisp', () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			// A 50x50 image contain-fits to 400px in the 600x400 canvas — an 8x
			// upscale — so the display scale exceeds 1:1.
			image: { src: 'tiny.png', naturalWidth: 50, naturalHeight: 50 },
		};
		render( <Cropper src="tiny.png" controller={ controller } /> );

		expect( imageRendering() ).toBe( 'pixelated' );
	} );

	it( 'renders downscaled (large) images smoothly', () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			// Tall image is shown well below 1:1 (fit ~0.33), even when the crop
			// magnifies, so the image is downscaled and should stay smooth.
			image: TALL_IMAGE,
			cropRect: { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
		};
		render( <Cropper src="tall.jpg" controller={ controller } /> );

		expect( imageRendering() ).not.toBe( 'pixelated' );
	} );
} );
