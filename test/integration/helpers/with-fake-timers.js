import { vi } from 'vitest';

/**
 * Set up fake timers for executing a function and restores them afterwards.
 *
 * @param {Function} fn Function to trigger.
 *
 * @return {*} The result of the function call.
 */
export async function withFakeTimers( fn ) {
	const usingFakeTimers = vi.isFakeTimers();

	// Portions of the React Native Animation API rely upon these APIs. However,
	// fake timers may mutate these globals, which breaks the Animated API. We
	// preserve the original implementations to restore them later.
	const requestAnimationFrameCopy = global.requestAnimationFrame;
	const cancelAnimationFrameCopy = global.cancelAnimationFrame;

	if ( ! usingFakeTimers ) {
		vi.useFakeTimers();
	}

	const result = await fn();

	if ( ! usingFakeTimers ) {
		vi.useRealTimers();

		global.requestAnimationFrame = requestAnimationFrameCopy;
		global.cancelAnimationFrame = cancelAnimationFrameCopy;
	}
	return result;
}
