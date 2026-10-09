import {
	useSelect,
	useDispatch,
	select as globalSelect,
	dispatch,
} from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { store as commandsStore } from '../store';
import { unlock } from '../lock-unlock';
import type { CommandConfig, CommandLoaderHook } from '../store/types';
import type { OnResolved } from './types';

const MAX_RECENTLY_SAVED = 30;
const MAX_RECENTLY_DISPLAYED = 5;
const EMPTY_ARRAY: string[] = [];
const EMPTY_COMMANDS: CommandConfig[] = [];
const EMPTY_SET = new Set< string >();

export function recordUsage( name: string ) {
	const current =
		( globalSelect( preferencesStore ).get(
			'core/commands',
			'recentlyUsed'
		) as string[] | undefined ) ?? [];
	const next = [ name, ...current.filter( ( n ) => n !== name ) ].slice(
		0,
		MAX_RECENTLY_SAVED
	);
	dispatch( preferencesStore ).set( 'core/commands', 'recentlyUsed', next );
}

export function useLoaderCollector(
	hook: CommandLoaderHook,
	name: string,
	filterNames: Set< string > | undefined,
	onResolved: OnResolved
) {
	const { setLoaderLoading } = unlock( useDispatch( commandsStore ) );
	const { isLoading: loading, commands = EMPTY_COMMANDS } =
		hook( { search: '' } ) ?? {};

	useEffect( () => {
		setLoaderLoading( name, loading );
	}, [ setLoaderLoading, name, loading ] );

	// A fresh array would re-run the effect below, and `onResolved`, on every render.
	const filtered = useMemo(
		() =>
			filterNames
				? commands.filter( ( c ) => filterNames.has( c.name ) )
				: commands,
		[ commands, filterNames ]
	);

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
		recentlyUsedNames = EMPTY_ARRAY,
	} = useSelect( ( select ) => {
		const { getCommands, getCommandLoaders } = select( commandsStore );
		return {
			contextualCommands: getCommands( true ),
			staticCommands: getCommands( false ),
			contextualLoaders: getCommandLoaders( true ),
			staticLoaders: getCommandLoaders( false ),
			recentlyUsedNames: select( preferencesStore ).get(
				'core/commands',
				'recentlyUsed'
			) as string[] | undefined,
		};
	}, [] );

	const [ resolvedMap, setResolvedMap ] = useState(
		() => new Map< string, CommandConfig[] >()
	);

	const onResolved: OnResolved = useCallback( ( loaderName, cmds ) => {
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

	const loaders = useMemo(
		() => [ ...contextualLoaders, ...staticLoaders ],
		[ contextualLoaders, staticLoaders ]
	);

	const commands = useMemo( () => {
		// Merge static commands with loader-resolved commands.
		const allByName = new Map< string, CommandConfig >();
		[ ...contextualCommands, ...staticCommands ].forEach( ( c ) =>
			allByName.set( c.name, c )
		);
		for ( const cmds of resolvedMap.values() ) {
			cmds.forEach( ( c ) => {
				if ( ! allByName.has( c.name ) ) {
					allByName.set( c.name, c );
				}
			} );
		}
		// Return in recency order.
		return recentNames
			.map( ( n ) => allByName.get( n ) )
			.filter( ( c ): c is CommandConfig => !! c );
	}, [ contextualCommands, staticCommands, resolvedMap, recentNames ] );

	if ( ! recentlyUsedNames.length ) {
		return {
			commands: [],
			loaders: [],
			recentSet: EMPTY_SET,
			onResolved,
		};
	}

	return { commands, loaders, recentSet, onResolved };
}
