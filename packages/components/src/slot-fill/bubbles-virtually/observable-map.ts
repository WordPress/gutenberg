/**
 * WordPress dependencies
 */
import { useMemo, useSyncExternalStore } from '@wordpress/element';

export type ObservableMap< K, V > = {
	get( name: K ): V | undefined;
	set( name: K, value: V ): void;
	delete( name: K ): void;
	subscribe( name: K, listener: () => void ): () => void;
};

export function observableMap< K, V >(): ObservableMap< K, V > {
	const map = new Map< K, V >();
	const listeners = new Map< K, Set< () => void > >();

	function callListeners( name: K ) {
		const list = listeners.get( name );
		if ( ! list ) {
			return;
		}
		for ( const listener of list ) {
			listener();
		}
	}

	function unsubscribe( name: K, listener: () => void ) {
		return () => {
			const list = listeners.get( name );
			if ( ! list ) {
				return;
			}

			list.delete( listener );
			if ( list.size === 0 ) {
				listeners.delete( name );
			}
		};
	}

	return {
		get( name ) {
			return map.get( name );
		},
		set( name, value ) {
			map.set( name, value );
			callListeners( name );
		},
		delete( name ) {
			map.delete( name );
			callListeners( name );
		},
		subscribe( name, listener ) {
			let list = listeners.get( name );
			if ( ! list ) {
				list = new Set();
				listeners.set( name, list );
			}
			list.add( listener );

			return unsubscribe( name, listener );
		},
	};
}

export function useObservableValue< K, V >(
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
	return useSyncExternalStore( subscribe, getValue );
}
