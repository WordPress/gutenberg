import { useMemo } from '@wordpress/element';
import { BlockEditorProvider } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEditorAssets, useEditorSettings } from '@wordpress/lazy-editor';
import { useNavigate, useParams } from '@wordpress/route';
import { unlock } from '@wordpress/routes-lock-unlock';

/**
 * Where the menu is used, with a live preview of each place, in place of
 * the menu's own preview. Only used while the Navigation menu editing
 * experiment is on (see `route.ts`).
 */
function NavigationLocationsCanvas() {
	const { id } = useParams( { from: '/navigation/edit/$id' } );
	const navigate = useNavigate();
	const { isReady: assetsReady } = useEditorAssets();
	const globalStylesId = useSelect(
		( select ) =>
			(
				select( coreStore ) as any
			 ).__experimentalGetCurrentGlobalStylesId(),
		[]
	);
	// The previews take the theme's styles from the block editor settings,
	// which nothing else on this route provides.
	const { isReady: settingsReady, editorSettings } = useEditorSettings( {
		stylesId: globalStylesId,
	} );
	const settings = useMemo(
		() => ( { ...editorSettings, isPreviewMode: true } ),
		[ editorSettings ]
	);

	if ( ! assetsReady || ! settingsReady ) {
		// Editor assets load fast after the menu editor beside this has
		// loaded them, so nothing is shown in the meantime.
		return null;
	}

	// Read from the global rather than imported, as in `editor/content.tsx`:
	// block-library only loads with the lazily loaded editor assets.
	const { MenuLocations } = unlock(
		( window as any ).wp.blockLibrary.privateApis
	);

	return (
		<BlockEditorProvider settings={ settings }>
			<MenuLocations
				navigationId={ parseInt( id ) }
				onEditLocation={ ( part: { id: string } ) =>
					navigate( {
						to: `/types/wp_template_part/edit/${ encodeURIComponent(
							part.id
						) }`,
					} )
				}
			/>
		</BlockEditorProvider>
	);
}

export const canvas = NavigationLocationsCanvas;
