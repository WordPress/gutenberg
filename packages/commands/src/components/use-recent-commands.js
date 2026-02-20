/**
 * External dependencies
 */
import { useCommandState } from 'cmdk';

/**
 * WordPress dependencies
 */
import {
	useSelect,
	useDispatch,
	select as globalSelect,
} from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { store as commandsStore } from '../store';

const MAX_RECENTLY_SAVED = 30;
const MAX_RECENTLY_DISPLAYED = 5;

export function useRecentCommands() {
	const { set: setPreference } = useDispatch( preferencesStore );
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );

	useEffect( () => {
		registerShortcut( {
			name: 'core/commands/remove-recent',
			category: 'global',
			description: __( 'Remove from recent commands.' ),
			keyCombination: {
				modifier: 'shift',
				character: 'Backspace',
			},
		} );
	}, [ registerShortcut ] );

	const recordUsage = useCallback(
		( name ) => {
			const current =
				globalSelect( preferencesStore ).get(
					'core/commands',
					'recentlyUsed'
				) ?? [];
			const next = [
				name,
				...current.filter( ( n ) => n !== name ),
			].slice( 0, MAX_RECENTLY_SAVED );
			setPreference( 'core/commands', 'recentlyUsed', next );
		},
		[ setPreference ]
	);

	const removeFromRecent = useCallback(
		( commandName ) => {
			const current =
				globalSelect( preferencesStore ).get(
					'core/commands',
					'recentlyUsed'
				) ?? [];
			const next = current.filter( ( n ) => n !== commandName );
			setPreference( 'core/commands', 'recentlyUsed', next );
		},
		[ setPreference ]
	);

	return { recordUsage, removeFromRecent };
}

export function useRemoveRecentShortcut() {
	const _value = useCommandState( ( state ) => state.value );
	const { removeFromRecent } = useRecentCommands();

	useShortcut( 'core/commands/remove-recent', ( event ) => {
		if ( ! _value?.startsWith( 'recent-' ) ) {
			return;
		}

		event.preventDefault();
		const commandName = _value.slice( 'recent-'.length );
		removeFromRecent( commandName );
	} );
}

export function useRecentCommandsData() {
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

	const allCommands = [ ...contextualCommands, ...staticCommands ];
	const loaders = [ ...contextualLoaders, ...staticLoaders ];

	if ( ! recentlyUsedNames.length ) {
		return {
			commands: [],
			loaders: [],
			displayNames: [],
			displaySet: new Set(),
		};
	}

	const displayNames = recentlyUsedNames.slice( 0, MAX_RECENTLY_DISPLAYED );
	const displaySet = new Set( displayNames );
	const commandsByName = new Map( allCommands.map( ( c ) => [ c.name, c ] ) );
	const commands = displayNames
		.map( ( name ) => commandsByName.get( name ) )
		.filter( Boolean );

	return { commands, loaders, displayNames, displaySet };
}
