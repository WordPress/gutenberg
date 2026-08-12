import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { Cropper } from '../cropper';
import type { CropperController } from '../../hooks/use-cropper-reducer';
import { DEFAULT_STATE } from '../../../core/constants';
import { getSourceRegion } from '../../../core/source-region';
// Browser Mode needs the package's real styles for layout and transitions.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '../../../style.scss';

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
		setImage: vi.fn(),
		setPan: vi.fn(),
		setZoom: vi.fn(),
		setZoomAtPoint: vi.fn(),
		setRotation: vi.fn(),
		setFlip: vi.fn(),
		toggleFlip: vi.fn(),
		snapRotate90: vi.fn(),
		setCropRect: vi.fn(),
		settleCrop: vi.fn(),
		applyOperation: vi.fn(),
		reset: vi.fn(),
		isDirty: false,
		getCroppedImage: vi.fn(),
		setVisualSize: vi.fn(),
		adjustCropRectForViewport: vi.fn(),
	};
}

function CropperFixture( { children }: { children: React.ReactNode } ) {
	return <div style={ { width: 648, height: 448 } }>{ children }</div>;
}

function renderCropper( cropper: React.ReactElement ) {
	const view = render( <CropperFixture>{ cropper }</CropperFixture> );
	return {
		...view,
		rerender: ( nextCropper: React.ReactElement ) =>
			view.rerender( <CropperFixture>{ nextCropper }</CropperFixture> ),
	};
}

function hasSettleTransition( element: HTMLElement ) {
	const style = getComputedStyle( element );
	return (
		style.transitionProperty === 'transform' &&
		style.transitionDuration === '0.2s' &&
		style.transitionTimingFunction === 'ease-out'
	);
}

afterEach( () => {
	vi.useRealTimers();
} );

describe( 'Cropper', () => {
	it( 'does not render the grid when showGrid is false', () => {
		renderCropper(
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
		renderCropper(
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
		renderCropper(
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
		renderCropper(
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
			name: 'Resize from top-left corner',
		} );

		await userEvent.tab();
		expect( handle ).toHaveFocus();

		expect( canvas ).not.toHaveAccessibleDescription(
			'When this area is focused, use arrow keys to move the image and plus or minus to zoom. Tab to resize handles and controls.'
		);
		expect( handle ).toHaveAccessibleDescription(
			'Use arrow keys to resize the crop area. Hold Shift for larger steps.'
		);
	} );

	it( 'clears the keyboard-active class when a pointer drag starts on a handle', async () => {
		renderCropper(
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
			name: 'Resize from top-left corner',
		} );
		const focusVisibleClass =
			'wp-media-editor-image-editor__canvas--focus-visible';

		// Simulate keyboard resize on a handle — the canvas should pick up
		// the keyboard-active class via the capture-phase keydown listener.
		act( () => {
			handle.focus();
		} );
		await userEvent.keyboard( '{ArrowRight}' );
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
		renderCropper(
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
			name: 'Resize from top-left corner',
		} );

		act( () => {
			handle.focus();
		} );
		await userEvent.keyboard( '{Escape}' );

		expect( canvas ).toHaveFocus();
	} );

	it( 'renders the grid hidden by default in interactive mode', async () => {
		renderCropper(
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
		renderCropper(
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
		const { rerender } = renderCropper(
			<Cropper
				src="test.jpg"
				controller={ controller }
				showDimming={ false }
				freeformCrop
			/>
		);

		await screen.findByRole( 'button', {
			name: 'Resize from top-left corner',
		} );
		( controller.setCropRect as Mock ).mockClear();
		( controller.adjustCropRectForViewport as Mock ).mockClear();

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
				name: 'Resize from top-left corner',
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
		renderCropper(
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
		renderCropper(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showDimming={ false }
				freeformCrop
			/>
		);

		const handle = await screen.findByRole( 'button', {
			name: 'Resize from top-left corner',
		} );
		vi.useFakeTimers();
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
		expect( hasSettleTransition( stage ) ).toBe( true );

		// Start a new resize before the settle fallback fires.
		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );

		// Settling must be cleared — no transition on the drag.
		expect( hasSettleTransition( stage ) ).toBe( false );

		// Advance past the old settle fallback; it was cancelled so the stage
		// should still have no transition.
		act( () => vi.advanceTimersByTime( 300 ) );
		expect( hasSettleTransition( stage ) ).toBe( false );

		fireEvent.pointerUp( handle, { pointerId: 1 } );

		vi.useRealTimers();
	} );

	it( 'keeps settling active until the settle transform transition ends', async () => {
		renderCropper(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showDimming={ false }
				freeformCrop
			/>
		);

		const handle = await screen.findByRole( 'button', {
			name: 'Resize from top-left corner',
		} );
		vi.useFakeTimers();
		const stage = screen.getByTestId( 'cropper-stage' );

		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );
		fireEvent.pointerUp( handle, { pointerId: 1 } );

		expect( hasSettleTransition( stage ) ).toBe( true );

		act( () => vi.advanceTimersByTime( 200 ) );
		expect( hasSettleTransition( stage ) ).toBe( true );

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

		expect( hasSettleTransition( stage ) ).toBe( false );

		vi.useRealTimers();
	} );

	it( 'clears settling via the fallback timer when no transitionend fires', async () => {
		renderCropper(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showDimming={ false }
				freeformCrop
			/>
		);

		const handle = await screen.findByRole( 'button', {
			name: 'Resize from top-left corner',
		} );
		vi.useFakeTimers();
		const stage = screen.getByTestId( 'cropper-stage' );

		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );
		fireEvent.pointerUp( handle, { pointerId: 1 } );

		expect( hasSettleTransition( stage ) ).toBe( true );

		// Without a transitionend, settling persists past the CSS duration...
		act( () => vi.advanceTimersByTime( 200 ) );
		expect( hasSettleTransition( stage ) ).toBe( true );

		// ...and is cleared by the fallback timer (CSS duration + 100ms).
		act( () => vi.advanceTimersByTime( 100 ) );
		expect( hasSettleTransition( stage ) ).toBe( false );

		vi.useRealTimers();
	} );

	it( 'ignores non-transform transitionend events while settling', async () => {
		renderCropper(
			<Cropper
				src="test.jpg"
				controller={ createController() }
				showDimming={ false }
				freeformCrop
			/>
		);

		const handle = await screen.findByRole( 'button', {
			name: 'Resize from top-left corner',
		} );
		vi.useFakeTimers();
		const stage = screen.getByTestId( 'cropper-stage' );

		fireEvent.pointerDown( handle, {
			button: 0,
			clientX: 100,
			clientY: 100,
			pointerId: 1,
		} );
		fireEvent.pointerUp( handle, { pointerId: 1 } );

		expect( hasSettleTransition( stage ) ).toBe( true );

		// A stencil left/top/width/height transitionend must not clear settling.
		const stencilTransitionEnd = new Event( 'transitionend', {
			bubbles: true,
		} );
		Object.defineProperty( stencilTransitionEnd, 'propertyName', {
			value: 'left',
		} );
		fireEvent( stage, stencilTransitionEnd );

		expect( hasSettleTransition( stage ) ).toBe( true );

		vi.useRealTimers();
	} );

	it( 'pans the canvas when a keyboard resize extends the crop past the canvas edge', async () => {
		// zoom: 2 so the image bounds extend past [0, 1] in normalized space,
		// allowing the crop to be resized beyond the canvas edge.
		const controller = createController();
		controller.state = { ...controller.state, zoom: 2 };

		renderCropper(
			<Cropper
				src="test.jpg"
				controller={ controller }
				showDimming={ false }
				freeformCrop
			/>
		);

		// East handle (4th button clockwise: nw, n, ne, e).
		const eHandle = await screen.findByRole( 'button', {
			name: 'Resize from right edge',
		} );
		vi.useFakeTimers();
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

		vi.useRealTimers();
	} );

	it( 'ignores wheel zoom while a crop resize is active', async () => {
		const controller = createController();
		renderCropper(
			<Cropper
				src="test.jpg"
				controller={ controller }
				showDimming={ false }
				freeformCrop
			/>
		);

		const resizeHandle = await screen.findByRole( 'button', {
			name: 'Resize from top-left corner',
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
		renderCropper(
			<Cropper
				src="test.jpg"
				controller={ controller }
				showDimming
				showGrid="interactive"
				freeformCrop
			/>
		);

		await screen.findByRole( 'button', {
			name: 'Resize from top-left corner',
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
		globalThis.cancelAnimationFrame = vi.fn();

		try {
			const controller = createController();
			const onGestureEnd = vi.fn();
			renderCropper(
				<Cropper
					src="test.jpg"
					controller={ controller }
					showDimming={ false }
					freeformCrop
					onGestureEnd={ onGestureEnd }
				/>
			);

			const resizeHandle = await screen.findByRole( 'button', {
				name: 'Resize from top-left corner',
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

			( controller.setPan as Mock ).mockClear();
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

			const touch = ( identifier: number, clientX: number ) =>
				new Touch( {
					identifier,
					target: canvas,
					clientX,
					clientY: 200,
				} );
			fireEvent(
				canvas,
				new TouchEvent( 'touchstart', {
					bubbles: true,
					cancelable: true,
					touches: [ touch( 1, 250 ), touch( 2, 350 ) ],
				} )
			);

			await act( async () => {
				await Promise.resolve();
			} );

			expect( controller.settleCrop ).not.toHaveBeenCalled();
			expect( onGestureEnd ).not.toHaveBeenCalled();

			( controller.setCropRect as Mock ).mockClear();
			( controller.setZoomAtPoint as Mock ).mockClear();

			fireEvent.pointerMove( resizeHandle, {
				button: 0,
				clientX: 60,
				clientY: 60,
				pointerId: 1,
				pointerType: 'touch',
				isPrimary: true,
			} );
			fireEvent(
				document,
				new TouchEvent( 'touchmove', {
					bubbles: true,
					cancelable: true,
					touches: [ touch( 1, 225 ), touch( 2, 375 ) ],
				} )
			);

			expect( controller.setCropRect ).not.toHaveBeenCalled();
			expect( controller.setZoomAtPoint ).toHaveBeenCalled();

			fireEvent(
				canvas,
				new TouchEvent( 'touchend', {
					bubbles: true,
					cancelable: true,
					touches: [],
				} )
			);

			expect( onGestureEnd ).toHaveBeenCalledTimes( 1 );
		} finally {
			globalThis.requestAnimationFrame = originalRAF;
			globalThis.cancelAnimationFrame = originalCAF;
		}
	} );

	// View-scale: at rest, the scene magnifies so an under-filling crop fills
	// the canvas. The sized fixture gives the canvas a real 600x400 box. A tall 400x1200 image contain-
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

	it( 'magnifies the scene so an under-filling crop fills the canvas at rest', async () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			image: TALL_IMAGE,
			// Centered square crop: width fills the footprint (133px), height
			// 1/3 of 400 = 133px. On-screen 133x133, well below 0.8 * 400.
			cropRect: { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
		};
		renderCropper( <Cropper src="tall.jpg" controller={ controller } /> );

		// Footprint is 133.33x400. The square crop's binding axis (height) fills
		// to 0.8 * 400, so the image magnifies by 0.8 * 400 / 133.33 = 2.4.
		await waitFor( () => expect( imageScale() ).toBeCloseTo( 2.4, 2 ) );
	} );

	it( 'computes image pan from the unscaled footprint before applying view scale', async () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			image: TALL_IMAGE,
			cropRect: { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
			pan: { x: 0.1, y: -0.05 },
		};
		renderCropper( <Cropper src="tall.jpg" controller={ controller } /> );

		await waitFor( () => expect( imageScale() ).toBeCloseTo( 2.4, 2 ) );
		const { viewScale, matrix } = imageTransformParts();

		expect( viewScale ).toBeCloseTo( 2.4, 2 );
		// Pan translations are produced by useTransformStyle from the unscaled
		// 133.33x400 footprint, then magnified by the leading scale(viewScale).
		// If useTransformStyle received scaledVisualSize, these would be 32 and
		// -48 instead.
		expect( matrix[ 4 ] ).toBeCloseTo( ( 400 / 3 ) * 0.1, 4 );
		expect( matrix[ 5 ] ).toBeCloseTo( 400 * -0.05, 5 );
	} );

	it( 'positions crop overlays against the magnified footprint', async () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			image: TALL_IMAGE,
			cropRect: { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
		};
		renderCropper(
			<Cropper src="tall.jpg" controller={ controller } showGrid />
		);

		await waitFor( () => expect( imageScale() ).toBeCloseTo( 2.4, 2 ) );

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

	it( 'does not magnify when the crop already fills the canvas', async () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			image: TALL_IMAGE,
			// Full-frame crop already fills the canvas height (footprint == 400).
			cropRect: { x: 0, y: 0, width: 1, height: 1 },
		};
		renderCropper( <Cropper src="tall.jpg" controller={ controller } /> );

		await waitFor( () =>
			expect( controller.setVisualSize ).toHaveBeenLastCalledWith( {
				width: expect.closeTo( 400 / 3, 2 ),
				height: 400,
			} )
		);
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
		renderCropper(
			<Cropper src="tall.jpg" controller={ controller } freeformCrop />
		);

		const handle = await screen.findByRole( 'button', {
			name: 'Resize from top-left corner',
		} );
		// At rest the square crop magnifies the image by 2.4.
		expect( imageScale() ).toBeCloseTo( 2.4, 2 );
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
		renderCropper(
			<Cropper src="tiny.png" controller={ controller } freeformCrop />
		);

		const handle = await screen.findByRole( 'button', {
			name: 'Resize from right edge',
		} );
		handle.focus();
		await userEvent.keyboard( '{ArrowRight}' );

		const rect = ( controller.setCropRect as Mock ).mock.calls[ 0 ][ 0 ];
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
		renderCropper(
			<Cropper src="wide.png" controller={ controller } freeformCrop />
		);

		const handle = await screen.findByRole( 'button', {
			name: 'Resize from right edge',
		} );
		( controller.setCropRect as Mock ).mockClear();
		handle.focus();
		await userEvent.keyboard( '{ArrowRight}' );

		const rect = ( controller.setCropRect as Mock ).mock.calls[ 0 ][ 0 ];
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
		renderCropper(
			<Cropper src="large.png" controller={ controller } freeformCrop />
		);

		const handle = await screen.findByRole( 'button', {
			name: 'Resize from right edge',
		} );
		handle.focus();
		await userEvent.keyboard( '{ArrowRight}' );

		const rect = ( controller.setCropRect as Mock ).mock.calls[ 0 ][ 0 ];
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
		const { rerender } = renderCropper(
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
		const rect = ( controller.setCropRect as Mock ).mock.calls[ 0 ][ 0 ];
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
		const { rerender } = renderCropper(
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
		return getComputedStyle(
			screen.getByTestId< HTMLImageElement >( 'cropper-image' )
		).imageRendering;
	}

	it( 'renders upscaled (small) images pixelated so pixel boundaries stay crisp', async () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			// A 50x50 image contain-fits to 400px in the 600x400 canvas — an 8x
			// upscale — so the display scale exceeds 1:1.
			image: { src: 'tiny.png', naturalWidth: 50, naturalHeight: 50 },
		};
		renderCropper( <Cropper src="tiny.png" controller={ controller } /> );

		await waitFor( () => expect( imageRendering() ).toBe( 'pixelated' ) );
	} );

	it( 'renders downscaled (large) images smoothly', async () => {
		const controller = createController();
		controller.state = {
			...controller.state,
			// Tall image is shown well below 1:1 (fit ~0.33), even when the crop
			// magnifies, so the image is downscaled and should stay smooth.
			image: TALL_IMAGE,
			cropRect: { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
		};
		renderCropper( <Cropper src="tall.jpg" controller={ controller } /> );

		await waitFor( () =>
			expect( controller.setVisualSize ).toHaveBeenLastCalledWith( {
				width: expect.closeTo( 400 / 3, 2 ),
				height: 400,
			} )
		);
		expect( imageRendering() ).not.toBe( 'pixelated' );
	} );
} );
