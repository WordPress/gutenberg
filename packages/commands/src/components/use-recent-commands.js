import {
	useSelect,
	useDispatch,
	select as globalSelect,
	dispatch,
} from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useEffect, useMemo } from '@wordpress/element';
import { store as commandsStore } from '../store';
import { unlock } from '../lock-unlock';

const MAX_RECENTLY_SAVED = 30;
const MAX_RECENTLY_DISPLAYED = 5;
const EMPTY_ARRAY = [];

export function recordUsage( name ) {
	const current =
		globalSelect( preferencesStore ).get(
			'core/commands',
			'recentlyUsed'
		) ?? [];
	const next = [ name, ...current.filter( ( n ) => n !== name ) ].slice(
		0,
		MAX_RECENTLY_SAVED
	);
	dispatch( preferencesStore ).set( 'core/commands', 'recentlyUsed', next );
}

export function useLoaderCollector( { hook, name, search, onResolved } ) {
	const { setLoaderLoading } = unlock( useDispatch( commandsStore ) );
	const { isLoading = false, commands = EMPTY_ARRAY } =
		hook( { search } ) ?? {};

	useEffect( () => {
		setLoaderLoading( name, isLoading );
	}, [ setLoaderLoading, name, isLoading ] );

	useEffect( () => {
		onResolved( name, commands );
	}, [ onResolved, name, commands ] );

	// Clear this loader's entries when it unmounts.
	useEffect( () => {
		return () => onResolved( name, EMPTY_ARRAY );
	}, [ onResolved, name ] );
}

export function useHasRecentCommands() {
	return useSelect(
		( select ) =>
			(
				select( preferencesStore ).get(
					'core/commands',
					'recentlyUsed'
				) ?? EMPTY_ARRAY
			).length > 0,
		[]
	);
}

export function useRecentCommands( commandPool ) {
	const recentlyUsedNames = useSelect(
		( select ) =>
			select( preferencesStore ).get( 'core/commands', 'recentlyUsed' ) ??
			EMPTY_ARRAY,
		[]
	);

	return useMemo( () => {
		const recentNames = recentlyUsedNames.slice(
			0,
			MAX_RECENTLY_DISPLAYED
		);
		if ( ! recentNames.length ) {
			return EMPTY_ARRAY;
		}
		const pool = new Map();
		for ( const command of commandPool ) {
			if ( ! pool.has( command.name ) ) {
				pool.set( command.name, command );
			}
		}
		return recentNames
			.map( ( name ) => pool.get( name ) )
			.filter( Boolean );
	}, [ recentlyUsedNames, commandPool ] );
}
