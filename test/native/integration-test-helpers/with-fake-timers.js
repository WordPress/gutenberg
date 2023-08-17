/**
 * Set up fake timers for executing a function and restores them afterwards.
 *
 * @param {Function} fn Function to trigger.
 *
 * @return {*} The result of the function call.
 */
export async function withFakeTimers( fn ) {
	const usingFakeTimers = jest.isMockFunction( setTimeout );

	// Portions of the React Native Animation API rely upon these APIs. However,
	// Jest's 'legacy' fake timers mutate these globals, which breaks the Animated
	// API. We preserve the original implementations to restore them later.
	const requestAnimationFrameCopy = global.requestAnimationFrame;
	const cancelAnimationFrameCopy = global.cancelAnimationFrame;

	if ( ! usingFakeTimers ) {
		jest.useFakeTimers( { legacyFakeTimers: true } );
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
