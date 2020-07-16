/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react-hooks';
import FakeTimers from '@sinonjs/fake-timers';

const mockedThrottle = jest.fn();
jest.mock( 'lodash', () => {
	const originalModule = jest.requireActual( 'lodash' );

	return {
		__esModule: true,
		...originalModule,
		throttle: ( ...args ) => {
			const originalReturn = originalModule.throttle( ...args );
			mockedThrottle.mockImplementation( () => originalReturn );
			return mockedThrottle();
		},
	};
} );

/**
 * Internal dependencies
 */
import useThrottle from '../use-throttle';

let clock;

describe( 'useThrottle', () => {
	const saveCallback = jest.fn();
	let result, rerender, unmount;

	beforeEach( () => {
		clock = FakeTimers.createClock();
		saveCallback.mockClear();
		mockedThrottle.mockClear();
		const hook = renderHook( () => useThrottle( 2 * 1000, saveCallback ) );
		unmount = hook.unmount;
		result = hook.result;
		rerender = hook.rerender;
	} );

	it( 'Should return two functions: scheduleSave and cancelSave', () => {
		expect( typeof result.current.scheduleSave ).toBe( 'function' );
		expect( typeof result.current.cancelSave ).toBe( 'function' );
	} );

	it( 'Should create a throttled callback on the first run only', () => {
		expect( mockedThrottle ).toBeCalledTimes( 1 );
		rerender();
		expect( mockedThrottle ).toBeCalledTimes( 1 );
	} );

	it( 'Should call the callback once after 10 seconds after calling scheduleSave once', async () => {
		expect( saveCallback ).toBeCalledTimes( 0 );
		result.current.scheduleSave();
		expect( saveCallback ).toBeCalledTimes( 0 );
		clock.setTimeout( () => {
			expect( saveCallback ).toBeCalledTimes( 0 );
		}, 9800 );
		clock.setTimeout( () => {
			expect( saveCallback ).toBeCalledTimes( 1 );
		}, 10100 );
		clock.setTimeout( () => {
			expect( saveCallback ).toBeCalledTimes( 1 );
		}, 100100 );
	} );

	it( 'Should call the callback only once after 10 seconds after calling scheduleSave multiple times  ', async () => {
		expect( saveCallback ).toBeCalledTimes( 0 );
		result.current.scheduleSave();
		result.current.scheduleSave();
		result.current.scheduleSave();
		result.current.scheduleSave();
		clock.setTimeout( () => {
			result.current.scheduleSave();
		}, 5000 );
		expect( saveCallback ).toBeCalledTimes( 0 );
		clock.setTimeout( () => {
			expect( saveCallback ).toBeCalledTimes( 0 );
		}, 9800 );
		clock.setTimeout( () => {
			expect( saveCallback ).toBeCalledTimes( 1 );
		}, 10100 );
		clock.setTimeout( () => {
			expect( saveCallback ).toBeCalledTimes( 1 );
		}, 100100 );
	} );

	it( 'Should schedule one more call after another 10 seconds when calling scheduleSave again after 10 seconds  ', async () => {
		expect( saveCallback ).toBeCalledTimes( 0 );
		result.current.scheduleSave();
		clock.setTimeout( () => {
			expect( saveCallback ).toBeCalledTimes( 1 );
			result.current.scheduleSave();
		}, 10100 );
		clock.setTimeout( () => {
			expect( saveCallback ).toBeCalledTimes( 2 );
		}, 20200 );
		clock.setTimeout( () => {
			expect( saveCallback ).toBeCalledTimes( 2 );
		}, 202000 );
	} );

	it( 'Should cancel the upcoming call after calling cancelSave  ', async () => {
		expect( saveCallback ).toBeCalledTimes( 0 );
		result.current.scheduleSave();
		result.current.cancelSave();
		clock.setTimeout( () => {
			expect( saveCallback ).toBeCalledTimes( 0 );
		}, 10100 );
	} );

	it( 'Should cancel the upcoming call after calling cancelSave (multiple initial calls) ', async () => {
		expect( saveCallback ).toBeCalledTimes( 0 );
		result.current.scheduleSave();
		result.current.scheduleSave();
		result.current.scheduleSave();
		result.current.cancelSave();
		clock.setTimeout( () => {
			expect( saveCallback ).toBeCalledTimes( 0 );
		}, 10100 );
	} );

	it( 'Not throw an error when callin cancelSave without calling scheduleSave ', async () => {
		expect( () => result.current.cancelSave() ).not.toThrowError();
	} );

	it( 'Should cancel save on umount ', async () => {
		const throttledFunction = mockedThrottle.mock.results[ 0 ].value;
		const spy = jest.spyOn( throttledFunction, 'cancel' );
		expect( spy ).not.toHaveBeenCalled();
		unmount();
		expect( spy ).toHaveBeenCalled();
	} );
} );
