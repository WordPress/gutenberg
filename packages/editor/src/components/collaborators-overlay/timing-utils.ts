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
		callback();
		timerHandle = setTimeout( runner, delayMs );
	};

	// Restart the runner if an exception killed it
	const guardInterval = setInterval( () => {
		if ( timerHandle ) {
			return;
		}

		timerHandle = setTimeout( () => {
			timerHandle = null;
			runner();
		}, 0 );
	}, delayMs );

	return () => {
		if ( timerHandle ) {
			clearTimeout( timerHandle );
		}

		clearInterval( guardInterval );
	};
}
