/**
 * Like setInterval but chains setTimeout calls, so the delay is measured from
 * the end of one run to the start of the next. This prevents callbacks from
 * stacking up when the main thread is busy.
 *
 * @param callback The function to call repeatedly.
 * @param delayMs  Milliseconds between runs.
 * @return A cleanup function that stops the timer.
 */
export function setDelayedInterval( callback: () => void, delayMs: number ) {
	let timerHandle: ReturnType< typeof setTimeout > | null = null;

	const runner = () => {
		try {
			callback();
		} catch ( error ) {
			// Do nothing
		}

		timerHandle = setTimeout( runner, delayMs );
	};

	timerHandle = setTimeout( runner, delayMs );

	return () => {
		if ( timerHandle ) {
			clearTimeout( timerHandle );
		}
	};
}
