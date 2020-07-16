/**
 * External dependencies
 */
import { throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useEffect } from '@wordpress/element';

const ONE_MINUTE = 60 * 1000;
export default function useThrottle( callback, interval = ONE_MINUTE ) {
	const throttled = useMemo( () => {
		return throttle( callback, interval, {
			leading: false,
			trailing: true,
		} );
	}, [] );

	const schedule = function () {
		return throttled();
	};
	const cancel = function () {
		return throttled.cancel();
	};

	useEffect( () => cancel, [] );

	return [ schedule, cancel ];
}
