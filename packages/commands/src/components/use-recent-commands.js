/**
 * WordPress dependencies
 */
import {
	useSelect,
	useDispatch,
	select as globalSelect,
	dispatch,
} from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';
import { unlock } from '../lock-unlock';

const MAX_RECENTLY_SAVED = 30;
const MAX_RECENTLY_DISPLAYED = 5;
const EMPTY_SET = new Set();

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

export function useLoaderCollector( hook, name, filterNames, onResolved ) {
	const { setLoaderLoading } = unlock( useDispatch( commandsStore ) );
	const { isLoading: loading, commands = [] } = hook( { search: '' } ) ?? {};

	useEffect( () => {
		setLoaderLoading( name, loading );
	}, [ setLoaderLoading, name, loading ] );

	const filtered = filterNames
		? commands.filter( ( c ) => filterNames.has( c.name ) )
		: commands;

	useEffect( () => {
		onResolved( name, filtered );
	}, [ onResolved, name, filtered ] );

	// Clear this loader's entries when it unmounts.
	useEffect( () => {
		return () => onResolved( name, [] );
	}, [ onResolved, name ] );
}

export function useRecentCommands() {
	const {
		contextualCommands,
		staticCommands,
		contextualLoaders,
		staticLoaders,
		recentlyUsedNames,
	} = useSelect( ( select ) => {
		const { getCommands, getCommandLoaders } = select( commandsStore );
		return {
			contextualCommands: getCommands( true ),
			staticCommands: getCommands( false ),
			contextualLoaders: getCommandLoaders( true ),
			staticLoaders: getCommandLoaders( false ),
			recentlyUsedNames:
				select( preferencesStore ).get(
					'core/commands',
					'recentlyUsed'
				) ?? [],
		};
	}, [] );

	const [ resolvedMap, setResolvedMap ] = useState( () => new Map() );

	const onResolved = useCallback( ( loaderName, cmds ) => {
		setResolvedMap( ( prev ) => {
			const prevCmds = prev.get( loaderName );
			if (
				prevCmds &&
				prevCmds.length === cmds.length &&
				prevCmds.every( ( c, i ) => c.name === cmds[ i ].name )
			) {
				return prev;
			}
			const next = new Map( prev );
			next.set( loaderName, cmds );
			return next;
		} );
	}, [] );

	const { recentNames, recentSet } = useMemo( () => {
		const names = recentlyUsedNames.slice( 0, MAX_RECENTLY_DISPLAYED );
		return { recentNames: names, recentSet: new Set( names ) };
	}, [ recentlyUsedNames ] );

	if ( ! recentlyUsedNames.length ) {
		return {
			commands: [],
			loaders: [],
			recentSet: EMPTY_SET,
			onResolved,
		};
	}

	const allStaticCommands = [ ...contextualCommands, ...staticCommands ];
	const loaders = [ ...contextualLoaders, ...staticLoaders ];

	// Merge static commands with loader-resolved commands.
	const allByName = new Map();
	allStaticCommands.forEach( ( c ) => allByName.set( c.name, c ) );
	for ( const cmds of resolvedMap.values() ) {
		cmds.forEach( ( c ) => {
			if ( ! allByName.has( c.name ) ) {
				allByName.set( c.name, c );
			}
		} );
	}
	// Return in recency order.
	const commands = recentNames
		.map( ( n ) => allByName.get( n ) )
		.filter( Boolean );

	return { commands, loaders, recentSet, onResolved };
}
