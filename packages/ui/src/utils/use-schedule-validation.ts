import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Dev-only hook that returns a stable `scheduleValidation` function.
 *
 * Each call debounces to `setTimeout(…, 0)` so that rapid
 * register / unregister cycles (e.g. React strict-mode double-mount)
 * settle before the check runs. The timer is cleaned up on unmount,
 * and calls after unmount are silently ignored.
 *
 * @param validate Callback that performs the actual validation.
 *                 Stored in a ref — safe to pass an unstable closure.
 */
export function useScheduleValidation( validate: () => void ) {
	const validateRef = useRef( validate );
	validateRef.current = validate;

	const timerRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const unmountedRef = useRef( false );

	const scheduleValidation = useCallback( () => {
		if ( unmountedRef.current ) {
			return;
		}
		if ( timerRef.current ) {
			clearTimeout( timerRef.current );
		}
		timerRef.current = setTimeout( () => {
			validateRef.current();
			timerRef.current = null;
		}, 0 );
	}, [] );

	useEffect( () => {
		unmountedRef.current = false;
		return () => {
			unmountedRef.current = true;
			if ( timerRef.current ) {
				clearTimeout( timerRef.current );
			}
		};
	}, [] );

	return scheduleValidation;
}
