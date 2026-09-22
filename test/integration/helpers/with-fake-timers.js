/**
 * Set up fake timers for executing a function and restores them afterwards.
 *
 * @param {Function} fn Function to trigger.
 *
 * @return {*} The result of the function call.
 */
export async function withFakeTimers( fn ) {
	const timers = globalThis.wpVitest?.timers ?? globalThis.wpJest;
	const usingFakeTimers = globalThis.wpVitest
		? timers.isFakeTimers()
		: timers.isMockFunction( setTimeout );

	// Portions of the React Native Animation API rely upon these APIs. However,
	// fake timers may mutate these globals, which breaks the Animated API. We
	// preserve the original implementations to restore them later.
	const requestAnimationFrameCopy = global.requestAnimationFrame;
	const cancelAnimationFrameCopy = global.cancelAnimationFrame;

	if ( ! usingFakeTimers ) {
		if ( globalThis.wpVitest ) {
			timers.useFakeTimers();
		} else {
			timers.useFakeTimers( { legacyFakeTimers: true } );
		}
	}

	const result = await fn();

	if ( ! usingFakeTimers ) {
		timers.useRealTimers();

		global.requestAnimationFrame = requestAnimationFrameCopy;
		global.cancelAnimationFrame = cancelAnimationFrameCopy;
	}
	return result;
}
