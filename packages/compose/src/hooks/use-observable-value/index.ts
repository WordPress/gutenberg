/**
 * WordPress dependencies
 */
import { useMemo, useSyncExternalStore } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ObservableMap } from '../../utils/observable-map';

/**
 * React hook that lets you observe an individual entry in an `ObservableMap`.
 *
 * @param map  The `ObservableMap` to observe.
 * @param name The map key to observe.
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
