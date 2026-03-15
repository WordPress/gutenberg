/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useContainerFit } from '../use-container-fit';

// Track all ResizeObserver instances and their callbacks.
let resizeCallbacks: ResizeObserverCallback[];
const observeMock = jest.fn();
const disconnectMock = jest.fn();

beforeAll( () => {
	resizeCallbacks = [];
	( global as any ).ResizeObserver = jest.fn( ( callback ) => {
		resizeCallbacks.push( callback );
		return {
			observe: observeMock,
			unobserve: jest.fn(),
			disconnect: disconnectMock,
		};
	} );
} );

beforeEach( () => {
	resizeCallbacks = [];
	observeMock.mockClear();
	disconnectMock.mockClear();
	( global as any ).ResizeObserver.mockClear();
} );

/**
 * Helper to create a mock ResizeObserverEntry.
 * @param width
 * @param height
 */
function createEntry( width: number, height: number ): ResizeObserverEntry {
	return {
		contentRect: {
			width,
			height,
			x: 0,
			y: 0,
			top: 0,
			right: width,
			bottom: height,
			left: 0,
			toJSON: () => {},
		},
		target: document.createElement( 'div' ),
		borderBoxSize: [],
		contentBoxSize: [],
		devicePixelContentBoxSize: [],
	} as unknown as ResizeObserverEntry;
}

/**
 * Trigger the most recently created ResizeObserver callback.
 * @param width
 * @param height
 */
function triggerResize( width: number, height: number ) {
	const lastCallback = resizeCallbacks[ resizeCallbacks.length - 1 ];
	if ( lastCallback ) {
		lastCallback( [ createEntry( width, height ) ], {} as ResizeObserver );
	}
}

describe( 'useContainerFit', () => {
	it( 'should return initial container size of 0x0', () => {
		const { result } = renderHook( () => useContainerFit() );

		expect( result.current.containerSize ).toEqual( {
			width: 0,
			height: 0,
		} );
	} );

	it( 'should return a containerRef', () => {
		const { result } = renderHook( () => useContainerFit() );

		expect( result.current.containerRef ).toBeDefined();
		expect( result.current.containerRef.current ).toBeNull();
	} );

	it( 'should observe the element when containerRef is attached', () => {
		// We need to render the hook with a real element on the ref.
		// Since useEffect reads containerRef.current, we need to
		// set it before the effect runs. We do this by providing an
		// initial value via Object.defineProperty before the hook mounts.
		const mockElement = document.createElement( 'div' );

		const { result } = renderHook( () => {
			const hookResult = useContainerFit();
			// Set the ref value so the effect picks it up.
			// This simulates React attaching the ref to a DOM node.
			(
				hookResult.containerRef as React.MutableRefObject< HTMLDivElement >
			 ).current = mockElement;
			return hookResult;
		} );

		// The effect should have created a ResizeObserver and called observe.
		expect( observeMock ).toHaveBeenCalledWith( mockElement );

		// Trigger a resize and verify containerSize updates.
		act( () => {
			triggerResize( 500, 300 );
		} );

		expect( result.current.containerSize ).toEqual( {
			width: 500,
			height: 300,
		} );
	} );

	it( 'should update containerSize when ResizeObserver fires multiple times', () => {
		const mockElement = document.createElement( 'div' );

		const { result } = renderHook( () => {
			const hookResult = useContainerFit();
			(
				hookResult.containerRef as React.MutableRefObject< HTMLDivElement >
			 ).current = mockElement;
			return hookResult;
		} );

		act( () => {
			triggerResize( 500, 300 );
		} );

		expect( result.current.containerSize ).toEqual( {
			width: 500,
			height: 300,
		} );

		act( () => {
			triggerResize( 800, 600 );
		} );

		expect( result.current.containerSize ).toEqual( {
			width: 800,
			height: 600,
		} );
	} );

	it( 'should disconnect observer on unmount', () => {
		const mockElement = document.createElement( 'div' );

		const { unmount } = renderHook( () => {
			const hookResult = useContainerFit();
			(
				hookResult.containerRef as React.MutableRefObject< HTMLDivElement >
			 ).current = mockElement;
			return hookResult;
		} );

		unmount();

		expect( disconnectMock ).toHaveBeenCalled();
	} );

	describe( 'getImageStyle', () => {
		/**
		 * Helper to set up the hook with a container of given dimensions.
		 * @param width
		 * @param height
		 */
		function setupWithContainerSize( width: number, height: number ) {
			const mockElement = document.createElement( 'div' );

			const view = renderHook( () => {
				const hookResult = useContainerFit();
				(
					hookResult.containerRef as React.MutableRefObject< HTMLDivElement >
				 ).current = mockElement;
				return hookResult;
			} );

			act( () => {
				triggerResize( width, height );
			} );

			return view;
		}

		it( 'should return empty object when container size is 0', () => {
			const { result } = renderHook( () => useContainerFit() );

			const style = result.current.getImageStyle( 800, 600, 0 );
			expect( style ).toEqual( {} );
		} );

		it( 'should return empty object when natural dimensions are 0', () => {
			const { result } = setupWithContainerSize( 500, 300 );

			const style = result.current.getImageStyle( 0, 0, 0 );
			expect( style ).toEqual( {} );
		} );

		it( 'should compute correct style for landscape image in landscape container', () => {
			const { result } = setupWithContainerSize( 500, 300 );

			// Image is 800x600, container is 500x300.
			// At 0 rotation, bounding box = 800x600.
			// scaleX = 500/800 = 0.625, scaleY = 300/600 = 0.5
			// scale = min(0.625, 0.5) = 0.5
			// fitted: 800*0.5=400, 600*0.5=300
			const style = result.current.getImageStyle( 800, 600, 0 );

			expect( style.width ).toBeCloseTo( 400 );
			expect( style.height ).toBeCloseTo( 300 );
			expect( style.maxWidth ).toBeCloseTo( 400 );
			expect( style.maxHeight ).toBeCloseTo( 300 );
		} );

		it( 'should compute correct style for portrait image in landscape container', () => {
			const { result } = setupWithContainerSize( 500, 300 );

			// Image is 400x800, container is 500x300.
			// At 0 rotation, bounding box = 400x800.
			// scaleX = 500/400 = 1.25, scaleY = 300/800 = 0.375
			// scale = min(1.25, 0.375) = 0.375
			// fitted: 400*0.375=150, 800*0.375=300
			const style = result.current.getImageStyle( 400, 800, 0 );

			expect( style.width ).toBeCloseTo( 150 );
			expect( style.height ).toBeCloseTo( 300 );
		} );

		it( 'should account for rotation when computing image style', () => {
			const { result } = setupWithContainerSize( 500, 500 );

			// Image is 200x100. At 90 degrees, bounding box swaps to ~100x200.
			// scaleX = 500/100 = 5, scaleY = 500/200 = 2.5
			// scale = min(5, 2.5) = 2.5
			// fitted: 200*2.5=500, 100*2.5=250
			const style = result.current.getImageStyle( 200, 100, 90 );

			expect( style.width ).toBeCloseTo( 500 );
			expect( style.height ).toBeCloseTo( 250 );
		} );

		it( 'should return a square image fitted to square container', () => {
			const { result } = setupWithContainerSize( 400, 400 );

			// Image is 1000x1000, no rotation.
			// scale = min(400/1000, 400/1000) = 0.4
			// fitted: 400x400
			const style = result.current.getImageStyle( 1000, 1000, 0 );

			expect( style.width ).toBeCloseTo( 400 );
			expect( style.height ).toBeCloseTo( 400 );
		} );
	} );
} );
