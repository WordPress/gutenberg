import { useDispatch, select as globalSelect, dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useEffect } from '@wordpress/element';
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

/**
 * Runs a single command loader and reports what it resolved to `onResolved`.
 *
 * Commands returned by a loader hook never pass through `registerCommand`, so
 * the loader's own category stands in whenever the hook sets none.
 *
 * @param {Object}   props
 * @param {Function} props.hook       The loader hook.
 * @param {string}   props.name       The loader's name.
 * @param {string}   props.category   The loader's category.
 * @param {boolean}  props.contextual Whether the loader is contextual.
 * @param {string}   props.search     The search term.
 * @param {Function} props.onResolved Called with the loader's name and result.
 */
export function useLoaderCollector( {
	hook,
	name,
	category,
	contextual,
	search,
	onResolved,
} ) {
	const { setLoaderLoading } = unlock( useDispatch( commandsStore ) );
	const { isLoading = false, commands = EMPTY_ARRAY } =
		hook( { search } ) ?? {};

	useEffect( () => {
		setLoaderLoading( name, isLoading );
	}, [ setLoaderLoading, name, isLoading ] );

	useEffect( () => {
		onResolved( name, {
			contextual,
			commands: commands.map( ( command ) =>
				command.category ? command : { ...command, category }
			),
		} );
	}, [ onResolved, name, contextual, category, commands ] );

	// Clear this loader's entries when it unmounts.
	useEffect( () => {
		return () => onResolved( name, { contextual, commands: EMPTY_ARRAY } );
	}, [ onResolved, name, contextual ] );
}

/**
 * Resolves the most recently used command names against a pool of commands,
 * keeping them in recency order and dropping the ones the pool cannot resolve.
 *
 * @param {string[]} recentlyUsedNames Command names, most recently used first.
 * @param {Object[]} commandPool       The commands to resolve the names against.
 *
 * @return {Object[]} The recently used commands.
 */
export function getRecentCommands( recentlyUsedNames, commandPool ) {
	const names = recentlyUsedNames.slice( 0, MAX_RECENTLY_DISPLAYED );
	if ( ! names.length ) {
		return EMPTY_ARRAY;
	}
	const pool = new Map();
	for ( const command of commandPool ) {
		if ( ! pool.has( command.name ) ) {
			pool.set( command.name, command );
		}
	}
	return names.map( ( name ) => pool.get( name ) ).filter( Boolean );
}
