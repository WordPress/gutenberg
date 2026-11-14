/**
 * Keeps the Suggestion mode guard on post-level entity writes installed for
 * the editor's lifetime. See `store/suggest-post-edit-guard.ts`.
 */
import { useRegistry } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { installSuggestPostEditGuard } from '../../store/suggest-post-edit-guard';
import { isSuggestionModeEnabled } from './gate';

/**
 * Install the guard before the editor's children first render, and remove it
 * when the editor unmounts.
 *
 * The lazy state initializer runs during the first render, ahead of every
 * child: a sidebar panel destructures `editEntityRecord` as it renders, and
 * one that rendered before an effect could patch the action would keep the
 * unguarded original until it happened to render again. Installing twice is
 * a no-op, so the effect re-installs after a Strict Mode remount without
 * doubling the wrap.
 */
export function useSuggestPostEditGuard() {
	const registry = useRegistry();
	useState( () => {
		if ( isSuggestionModeEnabled() ) {
			installSuggestPostEditGuard( registry );
		}
		return null;
	} );
	useEffect( () => {
		if ( ! isSuggestionModeEnabled() ) {
			return undefined;
		}
		return installSuggestPostEditGuard( registry );
	}, [ registry ] );
}
