import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { getLinkKeys } from './bulk-add-create-block';
import type { LinkKeyAttributes } from './bulk-add-create-block';

/**
 * Returns the keys of every link already in the menu that `rootClientId`
 * belongs to, so items in it can be marked "In this menu".
 *
 * @param rootClientId The Navigation block, or a sub menu inside it.
 * @return Keys from `getLinkKeys`.
 */
export function useLinksInMenu( rootClientId: string ): Set< string > {
	// A string, so the selector result compares by value. `getBlock` can't be
	// used here: it leaves out the Navigation block's controlled inner blocks.
	const joinedKeys = useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockAttributes,
				getBlockParentsByBlockName,
				getClientIdsOfDescendants,
			} = select( blockEditorStore );
			const navigationClientId =
				getBlockName( rootClientId ) === 'core/navigation'
					? rootClientId
					: ( getBlockParentsByBlockName(
							rootClientId,
							'core/navigation',
							true
						)[ 0 ] ?? rootClientId );
			return getClientIdsOfDescendants( navigationClientId )
				.filter( ( clientId ) =>
					[
						'core/navigation-link',
						'core/navigation-submenu',
					].includes( getBlockName( clientId ) as string )
				)
				.flatMap( ( clientId ) =>
					getLinkKeys(
						( getBlockAttributes( clientId ) ??
							{} ) as LinkKeyAttributes
					)
				)
				.join( '\n' );
		},
		[ rootClientId ]
	);

	return useMemo(
		() => new Set( joinedKeys ? joinedKeys.split( '\n' ) : [] ),
		[ joinedKeys ]
	);
}
