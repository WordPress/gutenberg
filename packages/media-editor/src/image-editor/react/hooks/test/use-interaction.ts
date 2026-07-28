/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useInteraction } from '../use-interaction';
import type { CropperInteractionActions } from '../../../core/interaction-controller';
import type { CropperState, Size } from '../../../core/types';
import { DEFAULT_STATE } from '../../../core/constants';

const CONTAINER_SIZE: Size = { width: 500, height: 300 };
const IMAGE_SIZE: Size = { width: 500, height: 300 };

function makeState( overrides: Partial< CropperState > = {} ): CropperState {
	return {
		...DEFAULT_STATE,
		image: {
			src: 'test.jpg',
			naturalWidth: 1000,
			naturalHeight: 600,
		},
		zoom: 2,
		...overrides,
	};
}

function createActions(): jest.Mocked< CropperInteractionActions > {
	return {
		setPan: jest.fn(),
		setZoom: jest.fn(),
		setZoomAtPoint: jest.fn(),
		snapRotate90: jest.fn(),
		toggleFlip: jest.fn(),
	};
}

function createWheelEvent(
	overrides: Partial< WheelEvent > & { currentTarget?: unknown } = {}
): WheelEvent {
	return {
		preventDefault: jest.fn(),
		deltaY: -100,
		clientX: 0,
		clientY: 0,
		currentTarget: null,
		...overrides,
	} as unknown as WheelEvent;
}

function createKeyboardEvent( key: string ): React.KeyboardEvent {
	return {
		key,
		nativeEvent: {
			key,
			preventDefault: jest.fn(),
		},
	} as unknown as React.KeyboardEvent;
}

function createTouchEvent(
	touches: Array< { clientX: number; clientY: number } >
): TouchEvent {
	return {
		preventDefault: jest.fn(),
		touches,
	} as unknown as TouchEvent;
}

function createTouchDocument(): Document & {
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
					( listener ) => listener !== fn
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

function createTouchTarget( ownerDocument: Document ) {
	return {
		getBoundingClientRect: () => ( {
			left: 0,
			top: 0,
			width: 500,
			height: 300,
		} ),
		ownerDocument,
	};
}

describe( 'useInteraction grid placement signal', () => {
	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'sets isPlacementActive during keyboard pan, then clears it after idle', () => {
		jest.useFakeTimers();
		const { result } = renderHook( () =>
			useInteraction(
				makeState(),
				createActions(),
				CONTAINER_SIZE,
				IMAGE_SIZE
			)
		);

		act( () => {
			result.current.handlers.onKeyDown(
				createKeyboardEvent( 'ArrowRight' )
			);
		} );

		expect( result.current.isPlacementActive ).toBe( true );

		act( () => {
			jest.advanceTimersByTime( 300 );
		} );

		expect( result.current.isPlacementActive ).toBe( false );
	} );

	it.each( [ '+', '-', 'r' ] )(
		'does not set isPlacementActive for non-placement key %s',
		( key ) => {
			const { result } = renderHook( () =>
				useInteraction(
					makeState(),
					createActions(),
					CONTAINER_SIZE,
					IMAGE_SIZE
				)
			);

			act( () => {
				result.current.handlers.onKeyDown( createKeyboardEvent( key ) );
			} );

			expect( result.current.isPlacementActive ).toBe( false );
		}
	);

	it( 'sets isPlacementActive during wheel zoom, then clears it after the wheel debounce', () => {
		jest.useFakeTimers();
		const { result } = renderHook( () =>
			useInteraction(
				makeState(),
				createActions(),
				CONTAINER_SIZE,
				IMAGE_SIZE
			)
		);

		act( () => {
			result.current.onWheelNative(
				createWheelEvent( { deltaY: -100, currentTarget: null } )
			);
		} );

		expect( result.current.isPlacementActive ).toBe( true );

		act( () => {
			jest.advanceTimersByTime( 300 );
		} );

		expect( result.current.isPlacementActive ).toBe( false );
	} );

	it( 'sets isPlacementActive during pinch zoom, then clears it on touch end', () => {
		const doc = createTouchDocument();
		const target = createTouchTarget( doc );
		const { result } = renderHook( () =>
			useInteraction(
				makeState(),
				createActions(),
				CONTAINER_SIZE,
				IMAGE_SIZE
			)
		);

		act( () => {
			result.current.handlers.onTouchStart( {
				currentTarget: target,
				nativeEvent: createTouchEvent( [
					{ clientX: 200, clientY: 150 },
					{ clientX: 300, clientY: 150 },
				] ),
			} as unknown as React.TouchEvent );
		} );

		expect( result.current.isPlacementActive ).toBe( true );

		act( () => {
			doc._fire( 'touchend', createTouchEvent( [] ) );
		} );

		expect( result.current.isPlacementActive ).toBe( false );
	} );
} );
