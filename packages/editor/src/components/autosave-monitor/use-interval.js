/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';

/**
 * Calls `callback` every `intervalInSeconds`. The latest `callback` is always
 * invoked without resetting the timer.
 *
 * @param {Function} callback          Function to call on each tick.
 * @param {number}   intervalInSeconds Seconds between ticks.
 */
export default function useInterval( callback, intervalInSeconds ) {
	const onTick = useEvent( callback );

	useEffect( () => {
		// Interval can be undefined before editor settings are populated.
		if ( ! intervalInSeconds ) {
			return;
		}

		const id = setInterval( onTick, intervalInSeconds * 1000 );
		return () => clearInterval( id );
	}, [ onTick, intervalInSeconds ] );
}
