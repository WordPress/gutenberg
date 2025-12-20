/**
 * WordPress dependencies
 */
import { useMemo, useSyncExternalStore } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ObservableMap } from '../../utils/observable-map';

/**
 * React hook that lets you observe an entry in an `ObservableMap`. The hook returns the
 * current value corresponding to the key, or `undefined` when there is no value stored.
 * It also observes changes to the value and triggers an update of the calling component
 * in case the value changes.
 *
 * @template K    The type of the keys in the map.
 * @template V    The type of the values in the map.
 * @param    map  The `ObservableMap` to observe.
 * @param    name The map key to observe.
 * @return   The value corresponding to the map key requested.
 */
export default function useObservableValue< K, V >(
	map: ObservableMap< K, V >,
	name: K
): V | undefined {
	const [ subscribe, getValue ] = useMemo(
		() => [
			( listener: () => void ) => map.subscribe( name, listener ),
			() => map.get( name ),
		],
		[ map, name ]
	);
	return useSyncExternalStore( subscribe, getValue, getValue );
}
