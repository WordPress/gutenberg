import { useDispatch, select as globalSelect, dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useEffect } from '@wordpress/element';
import { store as commandsStore } from '../store';
import { unlock } from '../lock-unlock';
import type { Command, CommandConfig } from '../store/types';
import type { LoaderCollectorOptions } from './types';

const MAX_RECENTLY_SAVED = 30;
const MAX_RECENTLY_DISPLAYED = 5;
const EMPTY_COMMANDS: CommandConfig[] = [];

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

/**
 * Reports a loader's loading state to the store, and clears it on unmount so
 * a loader removed mid-load does not keep the palette loading.
 *
 * @param name    Command loader name.
 * @param loading Whether the loader is loading.
 */
export function useLoaderLoadingState(
	name: string,
	loading: boolean | undefined
) {
	const { setLoaderLoading } = unlock( useDispatch( commandsStore ) );

	useEffect( () => {
		setLoaderLoading( name, loading );
	}, [ setLoaderLoading, name, loading ] );

	useEffect( () => {
		return () => setLoaderLoading( name, false );
	}, [ setLoaderLoading, name ] );
}

/**
 * Runs a single command loader and reports the commands it resolved to
 * `onResolved`.
 *
 * Commands returned by a loader hook never pass through `registerCommand`, so
 * the loader's own category stands in whenever the hook sets none.
 *
 * @param options            Options.
 * @param options.hook       The loader hook.
 * @param options.name       The loader's name.
 * @param options.category   The loader's category.
 * @param options.search     The search term.
 * @param options.onResolved Called with the loader's name and commands.
 */
export function useLoaderCollector( {
	hook,
	name,
	category,
	search,
	onResolved,
}: LoaderCollectorOptions ) {
	const { isLoading, commands = EMPTY_COMMANDS } = hook( { search } ) ?? {};
	useLoaderLoadingState( name, isLoading );

	useEffect( () => {
		onResolved(
			name,
			commands.map( ( command ) =>
				command.category ? command : { ...command, category }
			)
		);
	}, [ onResolved, name, category, commands ] );

	// Clear this loader's entries when it unmounts.
	useEffect( () => {
		return () => onResolved( name, EMPTY_COMMANDS );
	}, [ onResolved, name ] );
}

/**
 * Resolves the most recently used command names against a pool of commands,
 * keeping them in recency order and dropping the ones the pool cannot resolve.
 *
 * @param recentlyUsedNames Command names, most recently used first.
 * @param commandPool       The commands to resolve the names against,
 *                          de-duplicated by name.
 *
 * @return The recently used commands.
 */
export function getRecentCommands< T extends Command >(
	recentlyUsedNames: string[],
	commandPool: T[]
): T[] {
	const names = recentlyUsedNames.slice( 0, MAX_RECENTLY_DISPLAYED );
	if ( ! names.length ) {
		return [];
	}
	const pool = new Map(
		commandPool.map( ( command ) => [ command.name, command ] )
	);
	return names
		.map( ( name ) => pool.get( name ) )
		.filter( ( command ): command is T => !! command );
}
