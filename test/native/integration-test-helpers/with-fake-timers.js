/**
 * Set up fake timers for executing a function and restores them afterwards.
 *
 * @param {Function} fn Function to trigger.
 *
 * @return {*} The result of the function call.
 */
export async function withFakeTimers( fn ) {
	const usingFakeTimers = getJestFakeTimersType() !== null;

	// Portions of the React Native Animation API rely upon these APIs. However,
	// Jest's 'legacy' fake timers mutate these globals, which breaks the Animated
	// API. We preserve the original implementations to restore them later.
	const requestAnimationFrameCopy = global.requestAnimationFrame;
	const cancelAnimationFrameCopy = global.cancelAnimationFrame;

	if ( ! usingFakeTimers ) {
		jest.useFakeTimers();
	}

	// `Date.now` returns the real-time even when using fake timers.
	// Some functions like `debounce` relies on the time returned by this function
	// for its calculations, which can lead to wrong behaviors when executing timers.
	// To avoid this, we mock this function and return the time provided Jest fake timers.
	// Reference: https://jestjs.io/docs/jest-object#jestnow
	//
	// Eventually, we could explore using the "modern" fake timers, which would replace
	// this workaround. However, this won't be possible until upgrading RN to version `0.71`
	// or above. Once we apply the upgrade, we should consider removing this mock.
	let dateNowSpy;
	if ( ! jest.isMockFunction( Date.now ) ) {
		dateNowSpy = jest
			.spyOn( Date, 'now' )
			.mockImplementation( () => jest.now() );
	}

	const result = await fn();

	if ( ! usingFakeTimers ) {
		jest.useRealTimers();

		global.requestAnimationFrame = requestAnimationFrameCopy;
		global.cancelAnimationFrame = cancelAnimationFrameCopy;
	}

	if ( dateNowSpy ) {
		dateNowSpy.mockRestore();
	}
	return result;
}

/**
 * Get the type of Jest fake timers being used.
 *
 * @return {string | null} The type of Jest fake timers being used, or null if fake timers are not being used.
 *
 * @see https://github.com/callstack/react-native-testing-library/blob/a670b2d4c1fb4df5326a63cb2852f4d6e37756da/src/helpers/timers.ts#L24-L58
 */
function getJestFakeTimersType() {
	if (
		typeof jest === 'undefined' ||
		typeof globalObj.setTimeout === 'undefined' ||
		process.env.RNTL_SKIP_AUTO_DETECT_FAKE_TIMERS
	) {
		return null;
	}

	if (
		typeof globalObj.setTimeout._isMockFunction !== 'undefined' &&
		globalObj.setTimeout._isMockFunction
	) {
		return 'legacy';
	}

	if (
		typeof globalObj.setTimeout.clock !== 'undefined' &&
		typeof jest.getRealSystemTime !== 'undefined'
	) {
		try {
			// jest.getRealSystemTime is only supported for Jest's `modern` fake timers and otherwise throws
			jest.getRealSystemTime();
			return 'modern';
		} catch {
			// not using Jest's modern fake timers
		}
	}

	return null;
}

const globalObj = typeof window === 'undefined' ? global : window;
