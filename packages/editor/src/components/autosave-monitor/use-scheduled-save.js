/**
 * External dependencies
 */
import { throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useEffect } from '@wordpress/element';

const ONE_MINUTE = 60 * 1000;
export default function useScheduledSave(
	timeout = ONE_MINUTE,
	callback = null
) {
	const throttled = useMemo( () => {
		return throttle( callback, timeout, {
			leading: false,
			trailing: true,
		} );
	}, [] );

	const scheduleSave = function () {
		return throttled();
	};
	const cancelSave = function () {
		return throttled.cancel();
	};

	useEffect( () => cancelSave, [] );

	return {
		scheduleSave,
		cancelSave,
	};
}
