/**
 * Internal dependencies
 */
import { InteractionController } from '../interaction-controller';
import type { CropperAction, CropperState, Size } from '../types';
import { DEFAULT_STATE, MIN_ZOOM, MAX_ZOOM } from '../constants';

// The test environment is Node (not jsdom), so DOM globals like HTMLElement
// and Element are not available. Provide minimal stubs so that `instanceof`
// checks in the controller work as expected.
if ( typeof globalThis.HTMLElement === 'undefined' ) {
	( globalThis as any ).HTMLElement = class HTMLElement {};
}
if ( typeof globalThis.Element === 'undefined' ) {
	( globalThis as any ).Element = class Element {};
}

/**
 * Create a cropper state with an image set so restrictPanZoom works.
 *
 * @param overrides Partial state overrides.
 * @return A complete CropperState.
 */
function makeState( overrides: Partial< CropperState > = {} ): CropperState {
	return {
		...DEFAULT_STATE,
		image: {
			src: 'test.jpg',
			naturalWidth: 1000,
			naturalHeight: 600,
		},
		...overrides,
	};
}

/**
 * Create a minimal PointerEvent-like object for testing.
 *
 * @param overrides Partial PointerEvent property overrides.
 * @return A mock PointerEvent.
 */
function createPointerEvent(
	overrides: Partial< PointerEvent > = {}
): PointerEvent {
	return {
		button: 0,
		clientX: 0,
		clientY: 0,
		pointerId: 1,
		preventDefault: jest.fn(),
		...overrides,
	} as unknown as PointerEvent;
}

/**
 * Create a mock HTMLElement that tracks event listeners and supports _fire.
 *
 * @return A mock HTMLElement with a _fire helper to simulate events.
 */
function createMockElement(): HTMLElement & {
	_fire: ( type: string, event: unknown ) => void;
} {
	const listeners: Record< string, EventListener[] > = {};
	return {
		focus: jest.fn(),
		setPointerCapture: jest.fn(),
		releasePointerCapture: jest.fn(),
		addEventListener: jest.fn( ( type: string, fn: EventListener ) => {
			if ( ! listeners[ type ] ) {
				listeners[ type ] = [];
			}
			listeners[ type ].push( fn );
		} ),
		removeEventListener: jest.fn( ( type: string, fn: EventListener ) => {
			if ( listeners[ type ] ) {
				listeners[ type ] = listeners[ type ].filter(
					( l ) => l !== fn
				);
			}
		} ),
		ownerDocument: {
			activeElement: null,
		},
		_fire( type: string, event: unknown ) {
			listeners[ type ]?.forEach( ( fn ) =>
				fn( event as unknown as Event )
			);
		},
	} as unknown as HTMLElement & {
		_fire: ( type: string, event: unknown ) => void;
	};
}

/**
 * Create a minimal WheelEvent-like object for testing.
 *
 * @param overrides Partial WheelEvent property overrides.
 * @return A mock WheelEvent.
 */
function createWheelEvent(
	overrides: Partial< WheelEvent > & { currentTarget?: unknown } = {}
): WheelEvent {
	return {
		preventDefault: jest.fn(),
		deltaY: 0,
		clientX: 0,
		clientY: 0,
		...overrides,
	} as unknown as WheelEvent;
}

/**
 * Create a minimal KeyboardEvent-like object for testing.
 *
 * @param key       The key value.
 * @param overrides Partial KeyboardEvent property overrides.
 * @return A mock KeyboardEvent.
 */
function createKeyboardEvent(
	key: string,
	overrides: Partial< KeyboardEvent > = {}
): KeyboardEvent {
	return {
		key,
		preventDefault: jest.fn(),
		...overrides,
	} as unknown as KeyboardEvent;
}

/**
 * Create a minimal TouchEvent-like object for testing.
 *
 * @param touches   Array of touch point coordinates.
 * @param overrides Partial TouchEvent property overrides.
 * @return A mock TouchEvent.
 */
function createTouchEvent(
	touches: Array< { clientX: number; clientY: number } >,
	overrides: Partial< TouchEvent > = {}
): TouchEvent {
	return {
		preventDefault: jest.fn(),
		touches,
		...overrides,
	} as unknown as TouchEvent;
}

/**
 * Create a mock DOMRect for container bounding rect.
 *
 * @param overrides Partial DOMRect property overrides.
 * @return A mock DOMRect.
 */
function createContainerRect( overrides: Partial< DOMRect > = {} ): DOMRect {
	return {
		left: 0,
		top: 0,
		width: 500,
		height: 300,
		right: 500,
		bottom: 300,
		x: 0,
		y: 0,
		toJSON: jest.fn(),
		...overrides,
	} as DOMRect;
}

/**
 * Create a mock Document object that tracks event listeners and
 * supports _fire for simulating touch events.
 *
 * @return A mock Document with a _fire helper.
 */
function createMockDocument(): Document & {
	_fire: ( type: string, event: unknown ) => void;
} {
	const listeners: Record< string, EventListener[] > = {};
	return {
		addEventListener: jest.fn( ( type: string, fn: EventListener ) => {
			if ( ! listeners[ type ] ) {
				listeners[ type ] = [];
			}
			listeners[ type ].push( fn );
		} ),
		removeEventListener: jest.fn( ( type: string, fn: EventListener ) => {
			if ( listeners[ type ] ) {
				listeners[ type ] = listeners[ type ].filter(
					( l ) => l !== fn
				);
			}
		} ),
		_fire( type: string, event: unknown ) {
			listeners[ type ]?.forEach( ( fn ) =>
				fn( event as unknown as Event )
			);
		},
	} as unknown as Document & {
		_fire: ( type: string, event: unknown ) => void;
	};
}

describe( 'InteractionController', () => {
	const containerSize: Size = { width: 500, height: 300 };
	const imageSize: Size = { width: 500, height: 300 };
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

	/**
	 * Create an InteractionController with sensible test defaults.
	 *
	 * @param state   The cropper state to return from getState.
	 * @param options Additional InteractionControllerOptions overrides.
	 * @return The controller instance and the options object (for lazy mutation).
	 */
	function createController(
		state: CropperState,
		options: Record< string, unknown > = {}
	) {
		const opts = {
			getState: () => state,
			dispatch: dispatchMock,
			getContainerSize: () => containerSize,
			getImageSize: () => imageSize as Size | undefined,
			...options,
		};
		const controller = new InteractionController( opts );
		return { controller, opts };
	}

	describe( 'pointer drag', () => {
		it( 'dispatches SET_CROP on pointerdown + pointermove', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );
			const el = createMockElement();

			controller.handlePointerDown(
				createPointerEvent( { clientX: 100, clientY: 100 } ),
				el
			);

			// Simulate pointermove via the listener registered on el.
			el._fire(
				'pointermove',
				createPointerEvent( { clientX: 150, clientY: 120 } )
			);

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_PAN' } )
			);

			const setCropCall = dispatchMock.mock.calls.find(
				( call ) => call[ 0 ].type === 'SET_PAN'
			);
			expect( setCropCall ).toBeDefined();

			const payload = setCropCall![ 0 ].payload as {
				x: number;
				y: number;
			};
			// Delta: (150-100)/500 = 0.1 in x, (120-100)/300 = 0.0667 in y.
			expect( typeof payload.x ).toBe( 'number' );
			expect( typeof payload.y ).toBe( 'number' );

			// Clean up.
			el._fire( 'pointerup', createPointerEvent() );
		} );

		it( 'stops dispatching after pointerup', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );
			const el = createMockElement();

			controller.handlePointerDown(
				createPointerEvent( { clientX: 100, clientY: 100 } ),
				el
			);

			// Simulate pointerup.
			el._fire( 'pointerup', createPointerEvent() );

			dispatchMock.mockClear();

			// Another pointermove should not dispatch because the listener
			// was removed after pointerup.
			el._fire(
				'pointermove',
				createPointerEvent( { clientX: 200, clientY: 200 } )
			);

			expect( dispatchMock ).not.toHaveBeenCalled();
		} );

		it( 'calls onGestureStart on pointerdown and onGestureEnd on pointerup', () => {
			const state = makeState( { zoom: 2 } );
			const onGestureStart = jest.fn();
			const onGestureEnd = jest.fn();
			const { controller } = createController( state, {
				onGestureStart,
				onGestureEnd,
			} );
			const el = createMockElement();

			controller.handlePointerDown( createPointerEvent(), el );

			expect( onGestureStart ).toHaveBeenCalledTimes( 1 );
			expect( onGestureEnd ).not.toHaveBeenCalled();

			el._fire( 'pointerup', createPointerEvent() );

			expect( onGestureEnd ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'focuses the element on pointerdown', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );
			const el = createMockElement();

			controller.handlePointerDown( createPointerEvent(), el );

			expect( el.focus ).toHaveBeenCalled();
		} );

		it( 'reports isDragging via onStatusChange', () => {
			const state = makeState( { zoom: 2 } );
			const onStatusChange = jest.fn();
			const { controller } = createController( state, {
				onStatusChange,
			} );
			const el = createMockElement();

			controller.handlePointerDown( createPointerEvent(), el );

			expect( onStatusChange ).toHaveBeenCalledWith(
				expect.objectContaining( { isDragging: true } )
			);

			onStatusChange.mockClear();
			el._fire( 'pointerup', createPointerEvent() );

			expect( onStatusChange ).toHaveBeenCalledWith(
				expect.objectContaining( { isDragging: false } )
			);
		} );
	} );

	describe( 'wheel zoom', () => {
		it( 'dispatches SET_ZOOM on wheel without currentTarget element', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			// No currentTarget — falls through to SET_ZOOM path.
			controller.handleWheel(
				createWheelEvent( { deltaY: -100, currentTarget: null } )
			);

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_ZOOM' } )
			);

			const setZoomCall = dispatchMock.mock.calls.find(
				( call ) => call[ 0 ].type === 'SET_ZOOM'
			);
			// deltaY=-100, zoomSpeed=0.01, delta = 1, newZoom = 2+1 = 3.
			expect( setZoomCall![ 0 ].payload ).toBe( 3 );
		} );

		it( 'dispatches SET_ZOOM_AT_POINT on wheel with currentTarget element', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			// Create a target that passes `instanceof Element` with the
			// stub Element class registered above.
			const target = Object.create(
				( globalThis as any ).Element.prototype
			);
			target.getBoundingClientRect = () => ( {
				left: 0,
				top: 0,
				width: 500,
				height: 300,
			} );

			controller.handleWheel(
				createWheelEvent( {
					deltaY: -100,
					clientX: 250,
					clientY: 150,
					currentTarget: target,
				} )
			);

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_ZOOM_AT_POINT' } )
			);

			const call = dispatchMock.mock.calls.find(
				( c ) => c[ 0 ].type === 'SET_ZOOM_AT_POINT'
			);
			expect( call ).toBeDefined();
			expect( ( call![ 0 ].payload as { zoom: number } ).zoom ).toBe( 3 );
		} );

		it( 'clamps to maxZoom on large positive wheel', () => {
			const state = makeState( { zoom: 9 } );
			const { controller } = createController( state );

			controller.handleWheel(
				createWheelEvent( { deltaY: -500, currentTarget: null } )
			);

			const setZoomCall = dispatchMock.mock.calls.find(
				( call ) => call[ 0 ].type === 'SET_ZOOM'
			);
			// 9 + 5 = 14, clamped to MAX_ZOOM (10).
			expect( setZoomCall![ 0 ].payload ).toBe( MAX_ZOOM );
		} );

		it( 'clamps to minZoom on large negative wheel', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleWheel(
				createWheelEvent( { deltaY: 500, currentTarget: null } )
			);

			const setZoomCall = dispatchMock.mock.calls.find(
				( call ) => call[ 0 ].type === 'SET_ZOOM'
			);
			// 2 + (-5) = -3, clamped to MIN_ZOOM (1).
			expect( setZoomCall![ 0 ].payload ).toBe( MIN_ZOOM );
		} );

		it( 'respects custom zoomSpeed (read lazily from options)', () => {
			const state = makeState( { zoom: 2 } );
			const { controller, opts } = createController( state, {
				zoomSpeed: 0.01,
			} );

			// Mutate the option after construction to verify laziness.
			( opts as Record< string, unknown > ).zoomSpeed = 0.02;

			controller.handleWheel(
				createWheelEvent( { deltaY: -100, currentTarget: null } )
			);

			const setZoomCall = dispatchMock.mock.calls.find(
				( call ) => call[ 0 ].type === 'SET_ZOOM'
			);
			// deltaY=-100, zoomSpeed=0.02, delta = 2, zoom = 2+2 = 4.
			expect( setZoomCall![ 0 ].payload ).toBe( 4 );
		} );

		it( 'calls onGestureStart on first wheel, onGestureEnd after debounce', () => {
			jest.useFakeTimers( {
				doNotFake: [ 'requestAnimationFrame', 'cancelAnimationFrame' ],
			} );
			const state = makeState( { zoom: 2 } );
			const onGestureStart = jest.fn();
			const onGestureEnd = jest.fn();
			const { controller } = createController( state, {
				onGestureStart,
				onGestureEnd,
			} );

			controller.handleWheel(
				createWheelEvent( { deltaY: -50, currentTarget: null } )
			);

			expect( onGestureStart ).toHaveBeenCalledTimes( 1 );
			expect( onGestureEnd ).not.toHaveBeenCalled();

			// Another wheel event should not call onGestureStart again.
			controller.handleWheel(
				createWheelEvent( { deltaY: -50, currentTarget: null } )
			);
			expect( onGestureStart ).toHaveBeenCalledTimes( 1 );

			// Advance past the 300ms debounce.
			jest.advanceTimersByTime( 350 );

			expect( onGestureEnd ).toHaveBeenCalledTimes( 1 );

			jest.useRealTimers();
		} );
	} );

	describe( 'keyboard', () => {
		it( 'dispatches SET_CROP on ArrowUp', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'ArrowUp' ) );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_PAN' } )
			);

			const call = dispatchMock.mock.calls.find(
				( c ) => c[ 0 ].type === 'SET_PAN'
			);
			// ArrowUp scrolls the viewport up — image moves down, so y increases.
			expect(
				( call![ 0 ].payload as { y: number } ).y
			).toBeGreaterThanOrEqual( 0 );
		} );

		it( 'dispatches SET_CROP on ArrowDown', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'ArrowDown' ) );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_PAN' } )
			);
		} );

		it( 'dispatches SET_CROP on ArrowLeft', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'ArrowLeft' ) );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_PAN' } )
			);

			const call = dispatchMock.mock.calls.find(
				( c ) => c[ 0 ].type === 'SET_PAN'
			);
			// ArrowLeft scrolls the viewport left — image moves right, so x increases.
			expect(
				( call![ 0 ].payload as { x: number } ).x
			).toBeGreaterThanOrEqual( 0 );
		} );

		it( 'dispatches SET_CROP on ArrowRight', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'ArrowRight' ) );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_PAN' } )
			);
		} );

		it( 'dispatches SET_ZOOM on + key', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( '+' ) );

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_ZOOM' } )
			);

			const call = dispatchMock.mock.calls.find(
				( c ) => c[ 0 ].type === 'SET_ZOOM'
			);
			// 2 + 0.5 = 2.5.
			expect( call![ 0 ].payload ).toBe( 2.5 );
		} );

		it( 'dispatches SET_ZOOM on - key', () => {
			const state = makeState( { zoom: 3 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( '-' ) );

			const call = dispatchMock.mock.calls.find(
				( c ) => c[ 0 ].type === 'SET_ZOOM'
			);
			// 3 - 0.5 = 2.5.
			expect( call![ 0 ].payload ).toBe( 2.5 );
		} );

		it( 'dispatches SNAP_ROTATE_90 on r key', () => {
			const state = makeState( { rotation: 0 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'r' ) );

			expect( dispatchMock ).toHaveBeenCalledWith( {
				type: 'SNAP_ROTATE_90',
				payload: { direction: 1 },
			} );
		} );

		it( 'dispatches SNAP_ROTATE_90 on R key', () => {
			const state = makeState( { rotation: 90 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'R' ) );

			expect( dispatchMock ).toHaveBeenCalledWith( {
				type: 'SNAP_ROTATE_90',
				payload: { direction: 1 },
			} );
		} );

		it.each( [ 'metaKey', 'ctrlKey', 'altKey', 'shiftKey' ] )(
			'does not rotate when %s is held with r',
			( modifier ) => {
				const state = makeState( { rotation: 0 } );
				const { controller } = createController( state );

				controller.handleKeyDown(
					createKeyboardEvent( 'r', { [ modifier ]: true } )
				);

				expect( dispatchMock ).not.toHaveBeenCalled();
			}
		);

		it( 'respects custom keyboardStep (read lazily)', () => {
			const state = makeState( { zoom: 2 } );
			const { controller, opts } = createController( state, {
				keyboardStep: 0.05,
			} );

			// Mutate after construction.
			( opts as Record< string, unknown > ).keyboardStep = 0.1;

			controller.handleKeyDown( createKeyboardEvent( 'ArrowRight' ) );

			const call = dispatchMock.mock.calls.find(
				( c ) => c[ 0 ].type === 'SET_PAN'
			);
			// ArrowRight scrolls the viewport right — image moves left, so x decreases.
			// 0 - 0.1 = -0.1, within bounds.
			expect( ( call![ 0 ].payload as { x: number } ).x ).toBeCloseTo(
				-0.1
			);
		} );

		it( 'does not dispatch on unhandled keys', () => {
			const state = makeState();
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'a' ) );

			expect( dispatchMock ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'touch', () => {
		it( 'single-finger pan dispatches SET_CROP on first move', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );
			const doc = createMockDocument();
			const rect = createContainerRect();

			controller.handleTouchStart(
				createTouchEvent( [ { clientX: 100, clientY: 100 } ] ),
				rect,
				doc
			);

			// Simulate touchmove — pan should start on first move, no delay.
			doc._fire(
				'touchmove',
				createTouchEvent( [ { clientX: 150, clientY: 120 } ] )
			);

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_PAN' } )
			);
		} );

		it( 'calls onGestureStart/onGestureEnd for single-finger pan', () => {
			const state = makeState( { zoom: 2 } );
			const onGestureStart = jest.fn();
			const onGestureEnd = jest.fn();
			const { controller } = createController( state, {
				onGestureStart,
				onGestureEnd,
			} );
			const doc = createMockDocument();
			const rect = createContainerRect();

			controller.handleTouchStart(
				createTouchEvent( [ { clientX: 100, clientY: 100 } ] ),
				rect,
				doc
			);

			expect( onGestureStart ).toHaveBeenCalledTimes( 1 );
			expect( onGestureEnd ).not.toHaveBeenCalled();

			doc._fire( 'touchend', createTouchEvent( [] ) );

			expect( onGestureEnd ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'reports isDragging on first single-finger move', () => {
			const state = makeState( { zoom: 2 } );
			const onStatusChange = jest.fn();
			const { controller } = createController( state, {
				onStatusChange,
			} );
			const doc = createMockDocument();
			const rect = createContainerRect();

			controller.handleTouchStart(
				createTouchEvent( [ { clientX: 100, clientY: 100 } ] ),
				rect,
				doc
			);

			// isDragging is not set at touchstart — only on first move.
			expect( onStatusChange ).not.toHaveBeenCalledWith(
				expect.objectContaining( { isDragging: true } )
			);

			// First move triggers isDragging.
			doc._fire(
				'touchmove',
				createTouchEvent( [ { clientX: 105, clientY: 105 } ] )
			);

			expect( onStatusChange ).toHaveBeenCalledWith(
				expect.objectContaining( { isDragging: true } )
			);

			onStatusChange.mockClear();
			doc._fire( 'touchend', createTouchEvent( [] ) );

			expect( onStatusChange ).toHaveBeenCalledWith(
				expect.objectContaining( { isDragging: false } )
			);
		} );

		it( 'pinch zoom dispatches SET_ZOOM_AT_POINT (atomic)', () => {
			const state = makeState( { zoom: 1 } );
			const { controller } = createController( state );
			const doc = createMockDocument();
			const rect = createContainerRect();

			// Two-finger pinch start.
			controller.handleTouchStart(
				createTouchEvent( [
					{ clientX: 200, clientY: 150 },
					{ clientX: 300, clientY: 150 },
				] ),
				rect,
				doc
			);

			// Spread fingers apart — increase distance.
			doc._fire(
				'touchmove',
				createTouchEvent( [
					{ clientX: 150, clientY: 150 },
					{ clientX: 350, clientY: 150 },
				] )
			);

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_ZOOM_AT_POINT' } )
			);
		} );

		it( 'calls onGestureStart for pinch, onGestureEnd on touchend', () => {
			const state = makeState( { zoom: 1 } );
			const onGestureStart = jest.fn();
			const onGestureEnd = jest.fn();
			const { controller } = createController( state, {
				onGestureStart,
				onGestureEnd,
			} );
			const doc = createMockDocument();
			const rect = createContainerRect();

			controller.handleTouchStart(
				createTouchEvent( [
					{ clientX: 200, clientY: 150 },
					{ clientX: 300, clientY: 150 },
				] ),
				rect,
				doc
			);

			expect( onGestureStart ).toHaveBeenCalledTimes( 1 );

			doc._fire( 'touchend', createTouchEvent( [] ) );

			expect( onGestureEnd ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'late second finger switches from pan to pinch', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );
			const doc = createMockDocument();
			const rect = createContainerRect();

			// First finger lands alone.
			controller.handleTouchStart(
				createTouchEvent( [ { clientX: 200, clientY: 150 } ] ),
				rect,
				doc
			);

			// First move with 1 finger — starts pan.
			doc._fire(
				'touchmove',
				createTouchEvent( [ { clientX: 210, clientY: 155 } ] )
			);
			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_PAN' } )
			);
			dispatchMock.mockClear();

			// Second finger arrives via touchstart.
			controller.handleTouchStart(
				createTouchEvent( [
					{ clientX: 200, clientY: 150 },
					{ clientX: 350, clientY: 150 },
				] ),
				rect,
				doc
			);

			// Move with 2 fingers — should pinch, not pan.
			doc._fire(
				'touchmove',
				createTouchEvent( [
					{ clientX: 180, clientY: 150 },
					{ clientX: 370, clientY: 150 },
				] )
			);

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_ZOOM_AT_POINT' } )
			);
			// Should NOT have dispatched any more SET_CROP after switching.
			expect(
				dispatchMock.mock.calls.filter(
					( c ) => c[ 0 ].type === 'SET_PAN'
				)
			).toHaveLength( 0 );
		} );

		it( 'mid-move second finger triggers pinch without touchstart', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );
			const doc = createMockDocument();
			const rect = createContainerRect();

			// First finger lands.
			controller.handleTouchStart(
				createTouchEvent( [ { clientX: 200, clientY: 150 } ] ),
				rect,
				doc
			);

			// First touchmove already has 2 fingers (browser may batch).
			doc._fire(
				'touchmove',
				createTouchEvent( [
					{ clientX: 200, clientY: 150 },
					{ clientX: 350, clientY: 150 },
				] )
			);

			// First 2-finger move initializes pinch state, no dispatch yet.
			expect( dispatchMock ).not.toHaveBeenCalled();

			// Second 2-finger move dispatches pinch zoom.
			doc._fire(
				'touchmove',
				createTouchEvent( [
					{ clientX: 180, clientY: 150 },
					{ clientX: 370, clientY: 150 },
				] )
			);

			expect( dispatchMock ).toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_ZOOM_AT_POINT' } )
			);
		} );

		it( 'does not switch to pan after pinch finger is lifted', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );
			const doc = createMockDocument();
			const rect = createContainerRect();

			// Two fingers land simultaneously.
			controller.handleTouchStart(
				createTouchEvent( [
					{ clientX: 200, clientY: 150 },
					{ clientX: 350, clientY: 150 },
				] ),
				rect,
				doc
			);

			// Pinch move.
			doc._fire(
				'touchmove',
				createTouchEvent( [
					{ clientX: 180, clientY: 150 },
					{ clientX: 370, clientY: 150 },
				] )
			);

			dispatchMock.mockClear();

			// One finger lifts — move with 1 touch should NOT pan
			// because didPinch is true.
			doc._fire(
				'touchmove',
				createTouchEvent( [ { clientX: 250, clientY: 160 } ] )
			);

			expect( dispatchMock ).not.toHaveBeenCalledWith(
				expect.objectContaining( { type: 'SET_PAN' } )
			);
		} );
	} );

	describe( 'lazy options', () => {
		it( 'changing options.minZoom after construction affects behavior', () => {
			const state = makeState( { zoom: 2 } );
			const { controller, opts } = createController( state, {
				minZoom: MIN_ZOOM,
			} );

			// Raise minZoom to 1.5 — a large negative wheel should clamp there.
			( opts as Record< string, unknown > ).minZoom = 1.5;

			controller.handleWheel(
				createWheelEvent( { deltaY: 500, currentTarget: null } )
			);

			const setZoomCall = dispatchMock.mock.calls.find(
				( call ) => call[ 0 ].type === 'SET_ZOOM'
			);
			expect( setZoomCall![ 0 ].payload ).toBe( 1.5 );
		} );
	} );

	describe( 'destroy', () => {
		it( 'cleans up active touch listeners', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );
			const doc = createMockDocument();
			const rect = createContainerRect();

			controller.handleTouchStart(
				createTouchEvent( [ { clientX: 100, clientY: 100 } ] ),
				rect,
				doc
			);

			controller.destroy();

			// Touch listeners should have been removed via touchCleanup.
			expect( doc.removeEventListener ).toHaveBeenCalledWith(
				'touchmove',
				expect.any( Function )
			);
			expect( doc.removeEventListener ).toHaveBeenCalledWith(
				'touchend',
				expect.any( Function )
			);
			expect( doc.removeEventListener ).toHaveBeenCalledWith(
				'touchcancel',
				expect.any( Function )
			);
		} );

		it( 'cleans up active pointer drag listeners', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );
			const el = createMockElement();

			// Start a pointer drag — this registers move/up/lostcapture.
			controller.handlePointerDown(
				createPointerEvent( { clientX: 100, clientY: 100 } ),
				el
			);
			expect( el.addEventListener ).toHaveBeenCalledWith(
				'pointermove',
				expect.any( Function )
			);

			// Destroy mid-drag without dispatching pointerup.
			controller.destroy();

			expect( el.removeEventListener ).toHaveBeenCalledWith(
				'pointermove',
				expect.any( Function )
			);
			expect( el.removeEventListener ).toHaveBeenCalledWith(
				'pointerup',
				expect.any( Function )
			);
			expect( el.removeEventListener ).toHaveBeenCalledWith(
				'lostpointercapture',
				expect.any( Function )
			);
		} );

		it( 'does not dispatch if pointermove fires after destroy', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );
			const el = createMockElement();

			controller.handlePointerDown(
				createPointerEvent( { clientX: 100, clientY: 100 } ),
				el
			);
			dispatchMock.mockClear();

			controller.destroy();

			// A late pointermove event (e.g. queued before unmount) must
			// not reach the handler — listeners were removed.
			el._fire(
				'pointermove',
				createPointerEvent( { clientX: 150, clientY: 100 } )
			);
			expect( dispatchMock ).not.toHaveBeenCalled();
		} );
	} );
} );
