/**
 * WordPress dependencies
 */
import { useContext, useMemo, useSyncExternalStore } from '@wordpress/element';
import type { ObservableMap } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SlotFillContext from '../context';
import type { SlotKey } from '../types';

function useObservableValueWithSelector< K, V, S >(
	map: ObservableMap< K, V >,
	name: K,
	selector: ( v: V | undefined ) => S
) {
	const subscribe = useMemo(
		() => ( listener: () => void ) => map.subscribe( name, listener ),
		[ map, name ]
	);
	const getValue = () => selector( map.get( name ) );
	return useSyncExternalStore( subscribe, getValue, getValue );
}

function getLength< T >( array: T[] | undefined ) {
	return array?.length;
}

export default function useSlotFills( name: SlotKey ) {
	const registry = useContext( SlotFillContext );
	const length = useObservableValueWithSelector(
		registry.fills,
		name,
		getLength
	);
	// callers expect an opaque array with length `length`, so create that array
	const fills = useMemo( () => {
		return length !== undefined ? Array.from( { length } ) : undefined;
	}, [ length ] );
	return fills;
}
