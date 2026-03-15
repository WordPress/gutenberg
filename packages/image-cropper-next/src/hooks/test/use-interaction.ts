/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useInteraction } from '../use-interaction';
import type { CropperState, CropperAction, Size } from '../../core/types';
import { DEFAULT_STATE } from '../../core/constants';

/**
 * Create a mock state with optional overrides.
 *
 * @param overrides Partial state overrides.
 */
function createState( overrides: Partial< CropperState > = {} ): CropperState {
	return { ...DEFAULT_STATE, ...overrides };
}

/**
 * Create a mock React.MouseEvent.
 *
 * @param overrides Partial event overrides.
 */
function createMouseEvent(
	overrides: Partial< React.MouseEvent > = {}
): React.MouseEvent {
	return {
		preventDefault: jest.fn(),
		clientX: 0,
		clientY: 0,
		...overrides,
	} as unknown as React.MouseEvent;
}

/**
 * Create a mock React.WheelEvent.
 *
 * @param overrides Partial event overrides.
 */
function createWheelEvent(
	overrides: Partial< React.WheelEvent > = {}
): React.WheelEvent {
	return {
		preventDefault: jest.fn(),
		deltaY: 0,
		...overrides,
	} as unknown as React.WheelEvent;
}

/**
 * Create a mock React.KeyboardEvent.
 *
 * @param key       The key value.
 * @param overrides Partial event overrides.
 */
function createKeyboardEvent(
	key: string,
	overrides: Partial< React.KeyboardEvent > = {}
): React.KeyboardEvent {
	return {
		preventDefault: jest.fn(),
		key,
		...overrides,
	} as unknown as React.KeyboardEvent;
}

describe( 'useInteraction', () => {
	const containerSize: Size = { width: 500, height: 300 };
	let dispatchMock: jest.Mock< void, [ CropperAction ] >;

	// Store original requestAnimationFrame so we can restore it.
	const originalRAF = globalThis.requestAnimationFrame;
	const originalCAF = globalThis.cancelAnimationFrame;

	beforeAll( () => {
		// Replace requestAnimationFrame with immediate execution for tests.
		globalThis.requestAnimationFrame = ( cb: FrameRequestCallback ) => {
			cb( 0 );
			return 0;
		};
		globalThis.cancelAnimationFrame = jest.fn();
	} );

	afterAll( () => {
		globalThis.requestAnimationFrame = originalRAF;
		globalThis.cancelAnimationFrame = originalCAF;
	} );

	beforeEach( () => {
		dispatchMock = jest.fn();
	} );

	describe( 'mouse drag', () => {
		it( 'should dispatch SET_CROP on mousedown + mousemove', () => {
			const state = createState( { zoom: 2 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			// Simulate mousedown.
			act( () => {
				result.current.handlers.onMouseDown(
					createMouseEvent( { clientX: 100, clientY: 100 } )
				);
			} );

			// Simulate mousemove on the document.
			act( () => {
				const moveEvent = new MouseEvent( 'mousemove', {
					clientX: 150,
					clientY: 120,
				} );
				document.dispatchEvent( moveEvent );
			} );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_CROP' } )
			);

			const setCropCall = dispatchMock.mock.calls.find(
				( call ) => call[ 0 ].type === 'SET_CROP'
			);
			expect( setCropCall ).toBeDefined();

			const payload = setCropCall![ 0 ].payload;
			// Delta: (150-100)/500 = 0.1 in x, (120-100)/300 = 0.0667 in y.
			// At zoom=2, maxX = 1*(1-0.5)/2 = 0.25, so 0.1 is within bounds.
			expect( typeof payload.x ).toBe( 'number' );
			expect( typeof payload.y ).toBe( 'number' );

			// Clean up: simulate mouseup.
			act( () => {
				document.dispatchEvent( new MouseEvent( 'mouseup' ) );
			} );
		} );

		it( 'should stop dispatching after mouseup', () => {
			const state = createState( { zoom: 2 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onMouseDown(
					createMouseEvent( { clientX: 100, clientY: 100 } )
				);
			} );

			act( () => {
				document.dispatchEvent( new MouseEvent( 'mouseup' ) );
			} );

			dispatchMock.mockClear();

			act( () => {
				document.dispatchEvent(
					new MouseEvent( 'mousemove', {
						clientX: 200,
						clientY: 200,
					} )
				);
			} );

			expect( dispatchMock ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'wheel zoom', () => {
		it( 'should dispatch SET_ZOOM on wheel scroll', () => {
			const state = createState( { zoom: 2 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onWheel(
					createWheelEvent( { deltaY: -100 } )
				);
			} );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_ZOOM' } )
			);

			const setZoomCall = dispatchMock.mock.calls.find(
				( call ) => call[ 0 ].type === 'SET_ZOOM'
			);
			expect( setZoomCall ).toBeDefined();

			// deltaY=-100, zoomSpeed=0.01, delta = -(-100)*0.01 = 1
			// newZoom = restrictZoom(2 + 1, 1, 10) = 3
			expect( setZoomCall![ 0 ].payload ).toBe( 3 );
		} );

		it( 'should clamp zoom to max on large positive wheel', () => {
			const state = createState( { zoom: 9 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onWheel(
					createWheelEvent( { deltaY: -500 } )
				);
			} );

			const setZoomCall = dispatchMock.mock.calls.find(
				( call ) => call[ 0 ].type === 'SET_ZOOM'
			);
			// 9 + 5 = 14, clamped to 10
			expect( setZoomCall![ 0 ].payload ).toBe( 10 );
		} );

		it( 'should clamp zoom to min on large negative wheel', () => {
			const state = createState( { zoom: 2 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onWheel(
					createWheelEvent( { deltaY: 500 } )
				);
			} );

			const setZoomCall = dispatchMock.mock.calls.find(
				( call ) => call[ 0 ].type === 'SET_ZOOM'
			);
			// 2 + (-5) = -3, clamped to 1
			expect( setZoomCall![ 0 ].payload ).toBe( 1 );
		} );

		it( 'should respect custom zoomSpeed option', () => {
			const state = createState( { zoom: 2 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize, undefined, {
					zoomSpeed: 0.02,
				} )
			);

			act( () => {
				result.current.handlers.onWheel(
					createWheelEvent( { deltaY: -100 } )
				);
			} );

			const setZoomCall = dispatchMock.mock.calls.find(
				( call ) => call[ 0 ].type === 'SET_ZOOM'
			);
			// deltaY=-100, zoomSpeed=0.02, delta = 2, zoom = 2+2 = 4
			expect( setZoomCall![ 0 ].payload ).toBe( 4 );
		} );
	} );

	describe( 'keyboard', () => {
		it( 'should dispatch SET_CROP on ArrowUp', () => {
			const state = createState( { zoom: 2 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onKeyDown(
					createKeyboardEvent( 'ArrowUp' )
				);
			} );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_CROP' } )
			);

			const call = dispatchMock.mock.calls.find(
				( c ) => c[ 0 ].type === 'SET_CROP'
			);
			// ArrowUp decreases y by keyboardStep (0.05 default).
			expect( call![ 0 ].payload.y ).toBeLessThanOrEqual( 0 );
		} );

		it( 'should dispatch SET_CROP on ArrowDown', () => {
			const state = createState( { zoom: 2 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onKeyDown(
					createKeyboardEvent( 'ArrowDown' )
				);
			} );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_CROP' } )
			);
		} );

		it( 'should dispatch SET_CROP on ArrowLeft', () => {
			const state = createState( { zoom: 2 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onKeyDown(
					createKeyboardEvent( 'ArrowLeft' )
				);
			} );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_CROP' } )
			);

			const call = dispatchMock.mock.calls.find(
				( c ) => c[ 0 ].type === 'SET_CROP'
			);
			// ArrowLeft decreases x by keyboardStep.
			expect( call![ 0 ].payload.x ).toBeLessThanOrEqual( 0 );
		} );

		it( 'should dispatch SET_CROP on ArrowRight', () => {
			const state = createState( { zoom: 2 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onKeyDown(
					createKeyboardEvent( 'ArrowRight' )
				);
			} );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_CROP' } )
			);
		} );

		it( 'should dispatch SET_ZOOM on + key', () => {
			const state = createState( { zoom: 2 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onKeyDown( createKeyboardEvent( '+' ) );
			} );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_ZOOM' } )
			);

			const call = dispatchMock.mock.calls.find(
				( c ) => c[ 0 ].type === 'SET_ZOOM'
			);
			// 2 + 0.5 = 2.5
			expect( call![ 0 ].payload ).toBe( 2.5 );
		} );

		it( 'should dispatch SET_ZOOM on = key', () => {
			const state = createState( { zoom: 2 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onKeyDown( createKeyboardEvent( '=' ) );
			} );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_ZOOM' } )
			);
		} );

		it( 'should dispatch SET_ZOOM on - key', () => {
			const state = createState( { zoom: 3 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onKeyDown( createKeyboardEvent( '-' ) );
			} );

			const call = dispatchMock.mock.calls.find(
				( c ) => c[ 0 ].type === 'SET_ZOOM'
			);
			// 3 - 0.5 = 2.5
			expect( call![ 0 ].payload ).toBe( 2.5 );
		} );

		it( 'should dispatch SET_ROTATION on R key', () => {
			const state = createState( { rotation: 0 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onKeyDown( createKeyboardEvent( 'r' ) );
			} );

			expect( dispatchMock ).toHaveBeenCalledWith( {
				type: 'SET_ROTATION',
				payload: 90,
			} );
		} );

		it( 'should accumulate rotation on repeated R key presses', () => {
			const state = createState( { rotation: 90 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onKeyDown( createKeyboardEvent( 'R' ) );
			} );

			expect( dispatchMock ).toHaveBeenCalledWith( {
				type: 'SET_ROTATION',
				payload: 180,
			} );
		} );

		it( 'should respect custom keyboardStep option', () => {
			const state = createState( { zoom: 2 } );
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize, undefined, {
					keyboardStep: 0.1,
				} )
			);

			act( () => {
				result.current.handlers.onKeyDown(
					createKeyboardEvent( 'ArrowRight' )
				);
			} );

			const call = dispatchMock.mock.calls.find(
				( c ) => c[ 0 ].type === 'SET_CROP'
			);
			// At zoom=2 with full crop rect, maxX = 0.25.
			// 0 + 0.1 = 0.1, within bounds.
			expect( call![ 0 ].payload.x ).toBeCloseTo( 0.1 );
		} );

		it( 'should not dispatch on unhandled keys', () => {
			const state = createState();
			const { result } = renderHook( () =>
				useInteraction( state, dispatchMock, containerSize )
			);

			act( () => {
				result.current.handlers.onKeyDown( createKeyboardEvent( 'a' ) );
			} );

			expect( dispatchMock ).not.toHaveBeenCalled();
		} );
	} );
} );
