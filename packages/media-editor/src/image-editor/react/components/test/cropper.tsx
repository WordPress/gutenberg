/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

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

		const canvas = screen.getByRole( 'group', { name: 'Image editor' } );
		expect( canvas ).not.toHaveClass( GRID_INTERACTIVE_CLASS );
		expect( canvas ).not.toHaveClass( SHOW_GRID_CLASS );
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

		const canvas = screen.getByRole( 'group', { name: 'Image editor' } );
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

		const canvas = screen.getByRole( 'group', { name: 'Image editor' } );
		expect( canvas ).toHaveClass( GRID_INTERACTIVE_CLASS );
		expect( canvas ).toHaveClass( SHOW_GRID_CLASS );
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
		const canvas = screen.getByRole( 'group', { name: 'Image editor' } );

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
