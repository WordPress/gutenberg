/**
 * WordPress dependencies
 */
import { useDispatch, select as globalSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback } from '@wordpress/element';

const MAX_RECENTLY_SAVED = 30;

export function useRecentCommands() {
	const { set: setPreference } = useDispatch( preferencesStore );

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
