import { createContext, useContext, useLayoutEffect } from '@wordpress/element';

export const SlashInserterContext = createContext<
	( ( clientId: string ) => () => void ) | null
>( null );

/**
 * Keep the floating toolbar out of the way while the slash menu has results.
 *
 * @param clientId   The block that owns the slash menu.
 * @param hasResults Whether the menu is displaying results.
 */
export function useVisibleSlashInserter(
	clientId: string | undefined,
	hasResults: boolean
) {
	const register = useContext( SlashInserterContext );
	useLayoutEffect(
		() => ( clientId && hasResults ? register?.( clientId ) : undefined ),
		[ clientId, hasResults, register ]
	);
}
