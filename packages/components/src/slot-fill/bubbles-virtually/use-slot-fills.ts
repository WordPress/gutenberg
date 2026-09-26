import {
	useCallback,
	useContext,
	useMemo,
	useSyncExternalStore,
} from '@wordpress/element';
import type { ObservableMap } from '@wordpress/compose';
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

// A NUL character can't appear in a slot name (a DOM attribute/HTML class
// derivative in every existing usage), so it's a safe join separator for
// turning a set of names into a single comparable string snapshot below.
const SNAPSHOT_SEPARATOR = '\u0000';

/**
 * Like `useSlotFills`, but watches an arbitrary, dynamically-sized list of
 * slot names at once, returning the subset that currently have at least one
 * fill. `useSlotFills` can only be called once per fixed, statically-known
 * name — calling it in a loop over a list whose length can vary between
 * renders would call a varying number of hooks, which React doesn't allow.
 *
 * @param names The slot names to watch. Pass a referentially stable array
 *              (e.g. memoized) to avoid resubscribing on every render.
 *
 * @return The subset of `names` that currently have at least one fill.
 */
export function useSlotFillsForNames( names: SlotKey[] ): Set< SlotKey > {
	const registry = useContext( SlotFillContext );

	const subscribe = useCallback(
		( listener: () => void ) => {
			const unsubscribes = names.map( ( name ) =>
				registry.fills.subscribe( name, listener )
			);
			return () => {
				unsubscribes.forEach( ( unsubscribe ) => unsubscribe() );
			};
		},
		[ registry, names ]
	);

	const getSnapshot = () =>
		names
			.filter( ( name ) => !! registry.fills.get( name )?.length )
			.join( SNAPSHOT_SEPARATOR );

	const snapshot = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getSnapshot
	);

	return useMemo(
		() => new Set( snapshot ? snapshot.split( SNAPSHOT_SEPARATOR ) : [] ),
		[ snapshot ]
	);
}
