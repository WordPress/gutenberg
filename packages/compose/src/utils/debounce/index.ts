/**
 * Parts of this source were derived and modified from lodash,
 * released under the MIT license.
 *
 * https://github.com/lodash/lodash
 *
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 *
 * Based on Underscore.js, copyright Jeremy Ashkenas,
 * DocumentCloud and Investigative Reporters & Editors <http://underscorejs.org/>
 *
 * This software consists of voluntary contributions made by many
 * individuals. For exact contribution history, see the revision history
 * available at https://github.com/lodash/lodash
 *
 * The following license applies to all parts of this software except as
 * documented below:
 *
 * ====
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

export interface DebounceOptions {
	leading: boolean;
	maxWait: number;
	trailing: boolean;
}

export interface DebouncedFunc< T extends ( ...args: any[] ) => any > {
	/**
	 * Call the original function, but applying the debounce rules.
	 *
	 * If the debounced function can be run immediately, this calls it and returns its return
	 * value.
	 *
	 * Otherwise, it returns the return value of the last invocation, or undefined if the debounced
	 * function was not invoked yet.
	 */
	( ...args: Parameters< T > ): ReturnType< T > | undefined;

	/**
	 * Throw away any pending invocation of the debounced function.
	 */
	cancel: () => void;

	/**
	 * If there is a pending invocation of the debounced function, invoke it immediately and return
	 * its return value.
	 *
	 * Otherwise, return the value from the last invocation, or undefined if the debounced function
	 * was never invoked.
	 */
	flush: () => ReturnType< T > | undefined;
}

/**
 * A simplified and properly typed version of lodash's `debounce`, that
 * always uses timers instead of sometimes using rAF.
 *
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel delayed
 * `func` invocations and a `flush` method to immediately invoke them. Provide
 * `options` to indicate whether `func` should be invoked on the leading and/or
 * trailing edge of the `wait` timeout. The `func` is invoked with the last
 * arguments provided to the debounced function. Subsequent calls to the debounced
 * function return the result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * @param {Function}                   func             The function to debounce.
 * @param {number}                     wait             The number of milliseconds to delay.
 * @param {Partial< DebounceOptions >} options          The options object.
 * @param {boolean}                    options.leading  Specify invoking on the leading edge of the timeout.
 * @param {number}                     options.maxWait  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean}                    options.trailing Specify invoking on the trailing edge of the timeout.
 *
 * @return Returns the new debounced function.
 */
export const debounce = < FunctionT extends ( ...args: unknown[] ) => unknown >(
	func: FunctionT,
	wait: number,
	options?: Partial< DebounceOptions >
) => {
	let lastArgs: Parameters< FunctionT > | undefined;
	let lastThis: unknown | undefined;
	let maxWait = 0;
	let result: ReturnType< FunctionT >;
	let timerId: ReturnType< typeof setTimeout > | undefined;
	let lastCallTime: number | undefined;

	let lastInvokeTime = 0;
	let leading = false;
	let maxing = false;
	let trailing = true;

	if ( options ) {
		leading = !! options.leading;
		maxing = 'maxWait' in options;
		if ( options.maxWait !== undefined ) {
			maxWait = Math.max( options.maxWait, wait );
		}
		trailing = 'trailing' in options ? !! options.trailing : trailing;
	}

	function invokeFunc( time: number ) {
		const args = lastArgs;
		const thisArg = lastThis;

		lastArgs = undefined;
		lastThis = undefined;
		lastInvokeTime = time;

		result = func.apply( thisArg, args! ) as ReturnType< FunctionT >;
		return result;
	}

	function startTimer(
		pendingFunc: () => void,
		waitTime: number | undefined
	) {
		timerId = setTimeout( pendingFunc, waitTime );
	}

	function cancelTimer() {
		if ( timerId !== undefined ) {
			clearTimeout( timerId );
		}
	}

	function leadingEdge( time: number ) {
		// Reset any `maxWait` timer.
		lastInvokeTime = time;
		// Start the timer for the trailing edge.
		startTimer( timerExpired, wait );
		// Invoke the leading edge.
		return leading ? invokeFunc( time ) : result;
	}

	function getTimeSinceLastCall( time: number ) {
		return time - ( lastCallTime || 0 );
	}

	function remainingWait( time: number ) {
		const timeSinceLastCall = getTimeSinceLastCall( time );
		const timeSinceLastInvoke = time - lastInvokeTime;
		const timeWaiting = wait - timeSinceLastCall;

		return maxing
			? Math.min( timeWaiting, maxWait - timeSinceLastInvoke )
			: timeWaiting;
	}

	function shouldInvoke( time: number ) {
		const timeSinceLastCall = getTimeSinceLastCall( time );
		const timeSinceLastInvoke = time - lastInvokeTime;

		// Either this is the first call, activity has stopped and we're at the
		// trailing edge, the system time has gone backwards and we're treating
		// it as the trailing edge, or we've hit the `maxWait` limit.
		return (
			lastCallTime === undefined ||
			timeSinceLastCall >= wait ||
			timeSinceLastCall < 0 ||
			( maxing && timeSinceLastInvoke >= maxWait )
		);
	}

	function timerExpired() {
		const time = Date.now();
		if ( shouldInvoke( time ) ) {
			return trailingEdge( time );
		}
		// Restart the timer.
		startTimer( timerExpired, remainingWait( time ) );
		return undefined;
	}

	function clearTimer() {
		timerId = undefined;
	}

	function trailingEdge( time: number ) {
		clearTimer();

		// Only invoke if we have `lastArgs` which means `func` has been
		// debounced at least once.
		if ( trailing && lastArgs ) {
			return invokeFunc( time );
		}
		lastArgs = lastThis = undefined;
		return result;
	}

	function cancel() {
		cancelTimer();
		lastInvokeTime = 0;
		clearTimer();
		lastArgs = lastCallTime = lastThis = undefined;
	}

	function flush() {
		return pending() ? trailingEdge( Date.now() ) : result;
	}

	function pending() {
		return timerId !== undefined;
	}

	function debounced( this: unknown, ...args: Parameters< FunctionT > ) {
		const time = Date.now();
		const isInvoking = shouldInvoke( time );

		lastArgs = args;
		lastThis = this;
		lastCallTime = time;

		if ( isInvoking ) {
			if ( ! pending() ) {
				return leadingEdge( lastCallTime );
			}
			if ( maxing ) {
				// Handle invocations in a tight loop.
				startTimer( timerExpired, wait );
				return invokeFunc( lastCallTime );
			}
		}
		if ( ! pending() ) {
			startTimer( timerExpired, wait );
		}
		return result;
	}
	debounced.cancel = cancel;
	debounced.flush = flush;
	debounced.pending = pending;
	return debounced;
};
