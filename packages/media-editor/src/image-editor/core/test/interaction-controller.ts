/**
 * Internal dependencies
 */
import {
	InteractionController,
	type CropperInteractionActions,
} from '../interaction-controller';
import type { CropperState, Size } from '../types';
import {
	DEFAULT_STATE,
	DEFAULT_WHEEL_ZOOM_SPEED,
	MIN_ZOOM,
	MAX_ZOOM,
} from '../constants';

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
	let actionMocks: jest.Mocked< CropperInteractionActions >;

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
		actionMocks = {
			setPan: jest.fn(),
			setZoom: jest.fn(),
			setZoomAtPoint: jest.fn(),
			snapRotate90: jest.fn(),
			toggleFlip: jest.fn(),
		};
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
			actions: actionMocks,
			getContainerSize: () => containerSize,
			getImageSize: () => imageSize as Size | undefined,
			...options,
		};
		const controller = new InteractionController( opts );
		return { controller, opts };
	}

	describe( 'pointer drag', () => {
		it( 'calls setPan on pointerdown + pointermove', () => {
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

			expect( actionMocks.setPan ).toHaveBeenCalled();

			const payload = actionMocks.setPan.mock.calls[ 0 ][ 0 ];
			// Delta: (150-100)/500 = 0.1 in x, (120-100)/300 = 0.0667 in y.
			expect( typeof payload.x ).toBe( 'number' );
			expect( typeof payload.y ).toBe( 'number' );

			// Clean up.
			el._fire( 'pointerup', createPointerEvent() );
		} );

		it( 'ignores touch pointerdown so touch gestures own touch input', () => {
			const state = makeState( { zoom: 2 } );
			const onGestureStart = jest.fn();
			const onStatusChange = jest.fn();
			const { controller } = createController( state, {
				onGestureStart,
				onStatusChange,
			} );
			const el = createMockElement();
			const event = createPointerEvent( {
				clientX: 100,
				clientY: 100,
				pointerType: 'touch',
			} );

			controller.handlePointerDown( event, el );

			expect( event.preventDefault ).not.toHaveBeenCalled();
			expect( el.focus ).not.toHaveBeenCalled();
			expect( el.setPointerCapture ).not.toHaveBeenCalled();
			expect( el.addEventListener ).not.toHaveBeenCalled();
			expect( onGestureStart ).not.toHaveBeenCalled();
			expect( onStatusChange ).not.toHaveBeenCalled();

			el._fire(
				'pointermove',
				createPointerEvent( { clientX: 150, clientY: 120 } )
			);

			expect( actionMocks.setPan ).not.toHaveBeenCalled();
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

			jest.clearAllMocks();

			// Another pointermove should not dispatch because the listener
			// was removed after pointerup.
			el._fire(
				'pointermove',
				createPointerEvent( { clientX: 200, clientY: 200 } )
			);

			expect( actionMocks.setPan ).not.toHaveBeenCalled();
			expect( actionMocks.setZoom ).not.toHaveBeenCalled();
			expect( actionMocks.setZoomAtPoint ).not.toHaveBeenCalled();
			expect( actionMocks.snapRotate90 ).not.toHaveBeenCalled();
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
		it( 'calls setZoom on wheel without currentTarget element', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			// No currentTarget — falls through to SET_ZOOM path.
			controller.handleWheel(
				createWheelEvent( { deltaY: -100, currentTarget: null } )
			);

			expect( actionMocks.setZoom ).toHaveBeenCalled();

			const setZoomCall = actionMocks.setZoom.mock.calls[ 0 ];
			// deltaY=-100, default zoomSpeed = 0.0025, delta = 0.25.
			expect( setZoomCall![ 0 ] ).toBeCloseTo(
				2 + 100 * DEFAULT_WHEEL_ZOOM_SPEED
			);
		} );

		it( 'calls setZoomAtPoint on wheel with currentTarget element', () => {
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

			expect( actionMocks.setZoomAtPoint ).toHaveBeenCalled();
			expect(
				actionMocks.setZoomAtPoint.mock.calls[ 0 ][ 0 ]
			).toBeCloseTo( 2 + 100 * DEFAULT_WHEEL_ZOOM_SPEED );
		} );

		it( 'clamps to maxZoom on large positive wheel', () => {
			const state = makeState( { zoom: 9 } );
			const { controller } = createController( state );

			controller.handleWheel(
				createWheelEvent( { deltaY: -500, currentTarget: null } )
			);

			const setZoomCall = actionMocks.setZoom.mock.calls[ 0 ];
			// 9 + 1.25 = 10.25, clamped to MAX_ZOOM (10).
			expect( setZoomCall![ 0 ] ).toBe( MAX_ZOOM );
		} );

		it( 'clamps to minZoom on large negative wheel', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleWheel(
				createWheelEvent( { deltaY: 500, currentTarget: null } )
			);

			const setZoomCall = actionMocks.setZoom.mock.calls[ 0 ];
			// 2 + (-1.25) = 0.75, clamped to MIN_ZOOM (1).
			expect( setZoomCall![ 0 ] ).toBe( MIN_ZOOM );
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

			const setZoomCall = actionMocks.setZoom.mock.calls[ 0 ];
			// deltaY=-100, zoomSpeed=0.02, delta = 2, zoom = 2+2 = 4.
			expect( setZoomCall![ 0 ] ).toBe( 4 );
		} );

		it( 'does not zoom while pointer pan is active', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );
			const el = createMockElement();

			controller.handlePointerDown(
				createPointerEvent( { clientX: 100, clientY: 100 } ),
				el
			);

			jest.clearAllMocks();

			const wheelEvent = createWheelEvent( {
				deltaY: -100,
				currentTarget: null,
			} );
			controller.handleWheel( wheelEvent );

			expect( wheelEvent.preventDefault ).toHaveBeenCalled();
			expect( actionMocks.setZoom ).not.toHaveBeenCalled();
			expect( actionMocks.setZoomAtPoint ).not.toHaveBeenCalled();

			el._fire( 'pointerup', createPointerEvent() );
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
		it( 'calls setPan on ArrowUp', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'ArrowUp' ) );

			expect( actionMocks.setPan ).toHaveBeenCalled();

			const call = actionMocks.setPan.mock.calls[ 0 ];
			// ArrowUp scrolls the viewport up — image moves down, so y increases.
			expect( call![ 0 ].y ).toBeGreaterThanOrEqual( 0 );
		} );

		it( 'calls setPan on ArrowDown', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'ArrowDown' ) );

			expect( actionMocks.setPan ).toHaveBeenCalled();
		} );

		it( 'calls setPan on ArrowLeft', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'ArrowLeft' ) );

			expect( actionMocks.setPan ).toHaveBeenCalled();

			const call = actionMocks.setPan.mock.calls[ 0 ];
			// ArrowLeft scrolls the viewport left — image moves right, so x increases.
			expect( call![ 0 ].x ).toBeGreaterThanOrEqual( 0 );
		} );

		it( 'calls setPan on ArrowRight', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'ArrowRight' ) );

			expect( actionMocks.setPan ).toHaveBeenCalled();
		} );

		it( 'calls setZoom on + key', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( '+' ) );

			expect( actionMocks.setZoom ).toHaveBeenCalled();

			const call = actionMocks.setZoom.mock.calls[ 0 ];
			// 2 + 0.5 = 2.5.
			expect( call![ 0 ] ).toBe( 2.5 );
		} );

		it( 'calls setZoom on - key', () => {
			const state = makeState( { zoom: 3 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( '-' ) );

			const call = actionMocks.setZoom.mock.calls[ 0 ];
			// 3 - 0.5 = 2.5.
			expect( call![ 0 ] ).toBe( 2.5 );
		} );

		it( 'calls snapRotate90 on r key', () => {
			const state = makeState( { rotation: 0 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'r' ) );

			expect( actionMocks.snapRotate90 ).toHaveBeenCalledWith( 1 );
		} );

		it( 'calls snapRotate90 on R key', () => {
			const state = makeState( { rotation: 90 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'R' ) );

			expect( actionMocks.snapRotate90 ).toHaveBeenCalledWith( 1 );
		} );

		it( 'calls snapRotate90 counter-clockwise on shift+r', () => {
			const state = makeState( { rotation: 0 } );
			const { controller } = createController( state );

			controller.handleKeyDown(
				createKeyboardEvent( 'r', { shiftKey: true } )
			);

			expect( actionMocks.snapRotate90 ).toHaveBeenCalledWith( -1 );
		} );

		it.each( [ 'metaKey', 'ctrlKey', 'altKey' ] )(
			'does not rotate when %s is held with r',
			( modifier ) => {
				const state = makeState( { rotation: 0 } );
				const { controller } = createController( state );

				controller.handleKeyDown(
					createKeyboardEvent( 'r', { [ modifier ]: true } )
				);

				expect( actionMocks.setPan ).not.toHaveBeenCalled();
				expect( actionMocks.setZoom ).not.toHaveBeenCalled();
				expect( actionMocks.setZoomAtPoint ).not.toHaveBeenCalled();
				expect( actionMocks.snapRotate90 ).not.toHaveBeenCalled();
			}
		);

		it( 'calls flip horizontal on h key', () => {
			const state = makeState();
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'h' ) );

			expect( actionMocks.toggleFlip ).toHaveBeenCalledWith(
				'horizontal'
			);
		} );

		it( 'calls flip horizontal on H key', () => {
			const state = makeState();
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'H' ) );

			expect( actionMocks.toggleFlip ).toHaveBeenCalledWith(
				'horizontal'
			);
		} );

		it( 'calls flip vertical on v key', () => {
			const state = makeState();
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'v' ) );

			expect( actionMocks.toggleFlip ).toHaveBeenCalledWith( 'vertical' );
		} );

		it( 'calls flip vertical on V key', () => {
			const state = makeState();
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'V' ) );

			expect( actionMocks.toggleFlip ).toHaveBeenCalledWith( 'vertical' );
		} );

		it.each( [ 'metaKey', 'ctrlKey', 'altKey', 'shiftKey' ] )(
			'does not flip when %s is held with h',
			( modifier ) => {
				const state = makeState();
				const { controller } = createController( state );

				controller.handleKeyDown(
					createKeyboardEvent( 'h', { [ modifier ]: true } )
				);

				expect( actionMocks.toggleFlip ).not.toHaveBeenCalled();
			}
		);

		it.each( [ 'metaKey', 'ctrlKey', 'altKey', 'shiftKey' ] )(
			'does not flip when %s is held with v',
			( modifier ) => {
				const state = makeState();
				const { controller } = createController( state );

				controller.handleKeyDown(
					createKeyboardEvent( 'v', { [ modifier ]: true } )
				);

				expect( actionMocks.toggleFlip ).not.toHaveBeenCalled();
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

			const call = actionMocks.setPan.mock.calls[ 0 ];
			// ArrowRight scrolls the viewport right — image moves left, so x decreases.
			// 0 - 0.1 = -0.1, within bounds.
			expect( call![ 0 ].x ).toBeCloseTo( -0.1 );
		} );

		it( 'uses fine keyboardStep by default for arrow key panning', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'ArrowRight' ) );

			const call = actionMocks.setPan.mock.calls[ 0 ];
			expect( call![ 0 ].x ).toBeCloseTo( -0.01 );
		} );

		it( 'uses a 10x larger keyboardStep when Shift is held while panning', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );

			controller.handleKeyDown(
				createKeyboardEvent( 'ArrowRight', { shiftKey: true } )
			);

			const call = actionMocks.setPan.mock.calls[ 0 ];
			expect( call![ 0 ].x ).toBeCloseTo( -0.1 );
		} );

		it( 'applies the Shift multiplier to custom keyboardStep while panning', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state, {
				keyboardStep: 0.02,
			} );

			controller.handleKeyDown(
				createKeyboardEvent( 'ArrowRight', { shiftKey: true } )
			);

			const call = actionMocks.setPan.mock.calls[ 0 ];
			expect( call![ 0 ].x ).toBeCloseTo( -0.2 );
		} );

		it( 'does not dispatch on unhandled keys', () => {
			const state = makeState();
			const { controller } = createController( state );

			controller.handleKeyDown( createKeyboardEvent( 'a' ) );

			expect( actionMocks.setPan ).not.toHaveBeenCalled();
			expect( actionMocks.setZoom ).not.toHaveBeenCalled();
			expect( actionMocks.setZoomAtPoint ).not.toHaveBeenCalled();
			expect( actionMocks.snapRotate90 ).not.toHaveBeenCalled();
			expect( actionMocks.toggleFlip ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'touch', () => {
		it( 'single-finger pan calls setPan on first move', () => {
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

			expect( actionMocks.setPan ).toHaveBeenCalled();
		} );

		it( 'prevents default on touchmove so the page does not scroll mid-gesture', () => {
			const state = makeState( { zoom: 2 } );
			const { controller } = createController( state );
			const doc = createMockDocument();
			const rect = createContainerRect();

			controller.handleTouchStart(
				createTouchEvent( [ { clientX: 100, clientY: 100 } ] ),
				rect,
				doc
			);

			const moveEvent = createTouchEvent( [
				{ clientX: 150, clientY: 120 },
			] );
			doc._fire( 'touchmove', moveEvent );

			expect( moveEvent.preventDefault ).toHaveBeenCalled();
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

		it( 'pinch zoom calls setZoomAtPoint atomically', () => {
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

			expect( actionMocks.setZoomAtPoint ).toHaveBeenCalled();
		} );

		it( 'keeps a repeated pinch zoom anchored to the pinch-start midpoint from a zoomed and panned state', () => {
			let state = makeState( {
				zoom: 2,
				pan: { x: 0.1, y: -0.05 },
			} );
			actionMocks.setZoomAtPoint.mockImplementation( ( zoom, pan ) => {
				state = { ...state, zoom, pan };
			} );
			const { controller } = createController( state, {
				getState: () => state,
			} );
			const doc = createMockDocument();
			const rect = createContainerRect();

			controller.handleTouchStart(
				createTouchEvent( [
					{ clientX: 300, clientY: 180 },
					{ clientX: 400, clientY: 180 },
				] ),
				rect,
				doc
			);

			doc._fire(
				'touchmove',
				createTouchEvent( [
					{ clientX: 275, clientY: 180 },
					{ clientX: 425, clientY: 180 },
				] )
			);
			doc._fire(
				'touchmove',
				createTouchEvent( [
					{ clientX: 250, clientY: 180 },
					{ clientX: 450, clientY: 180 },
				] )
			);

			expect( actionMocks.setZoomAtPoint ).toHaveBeenCalledTimes( 2 );
			const [ zoom, pan ] =
				actionMocks.setZoomAtPoint.mock.calls[
					actionMocks.setZoomAtPoint.mock.calls.length - 1
				];
			expect( zoom ).toBeCloseTo( 4 );
			expect( pan.x ).toBeCloseTo( 0 );
			expect( pan.y ).toBeCloseTo( -0.2 );
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
			expect( actionMocks.setPan ).toHaveBeenCalled();
			jest.clearAllMocks();

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

			expect( actionMocks.setZoomAtPoint ).toHaveBeenCalled();
			// Should NOT have panned after switching.
			expect( actionMocks.setPan ).not.toHaveBeenCalled();
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
			expect( actionMocks.setPan ).not.toHaveBeenCalled();
			expect( actionMocks.setZoom ).not.toHaveBeenCalled();
			expect( actionMocks.setZoomAtPoint ).not.toHaveBeenCalled();
			expect( actionMocks.snapRotate90 ).not.toHaveBeenCalled();

			// Second 2-finger move dispatches pinch zoom.
			doc._fire(
				'touchmove',
				createTouchEvent( [
					{ clientX: 180, clientY: 150 },
					{ clientX: 370, clientY: 150 },
				] )
			);

			expect( actionMocks.setZoomAtPoint ).toHaveBeenCalled();
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

			jest.clearAllMocks();

			// One finger lifts — move with 1 touch should NOT pan
			// because didPinch is true.
			doc._fire(
				'touchmove',
				createTouchEvent( [ { clientX: 250, clientY: 160 } ] )
			);

			expect( actionMocks.setPan ).not.toHaveBeenCalled();
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

			const setZoomCall = actionMocks.setZoom.mock.calls[ 0 ];
			expect( setZoomCall![ 0 ] ).toBe( 1.5 );
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
			jest.clearAllMocks();

			controller.destroy();

			// A late pointermove event (e.g. queued before unmount) must
			// not reach the handler — listeners were removed.
			el._fire(
				'pointermove',
				createPointerEvent( { clientX: 150, clientY: 100 } )
			);
			expect( actionMocks.setPan ).not.toHaveBeenCalled();
			expect( actionMocks.setZoom ).not.toHaveBeenCalled();
			expect( actionMocks.setZoomAtPoint ).not.toHaveBeenCalled();
			expect( actionMocks.snapRotate90 ).not.toHaveBeenCalled();
		} );
	} );
} );
