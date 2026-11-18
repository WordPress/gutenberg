import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useEntityRecords } from '@wordpress/core-data';
import usePatternSettings from '../page-patterns/use-pattern-settings';
import Editor from '../editor';
import { PRELOADED_NAVIGATION_MENUS_QUERY } from '../sidebar-navigation-screen-navigation-menus/constants';
import { unlock } from '../../lock-unlock';
import { NAVIGATION_POST_TYPE } from '../../utils/constants';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );
const { MenuLocations } = unlock( blockLibraryPrivateApis );
const { useHistory, useLocation } = unlock( routerPrivateApis );

function isNavigationMenuEditingEnabled(): boolean {
	return !! (
		globalThis as typeof globalThis & {
			__experimentalNavigationMenuEditing?: boolean;
		}
	 )?.__experimentalNavigationMenuEditing;
}

function NavigationMenuLocations( { navigationId }: { navigationId: number } ) {
	const history = useHistory();
	// Previews are rendered outside the editor, so they get the theme's
	// styles the same way the patterns and templates lists do.
	const settings = usePatternSettings();

	return (
		<ExperimentalBlockEditorProvider settings={ settings }>
			<MenuLocations
				navigationId={ navigationId }
				onEditLocation={ ( part: { id: string } ) =>
					history.navigate(
						`/wp_template_part/${ part.id }?canvas=edit`
					)
				}
			/>
		</ExperimentalBlockEditorProvider>
	);
}

/**
 * The canvas while a menu is open in the Navigation section: where the menu
 * is used, with live previews, when the Navigation menu editing experiment is
 * on. Otherwise the editor, as before.
 */
export function NavigationMenuItemCanvas() {
	const {
		params: { postId },
		query,
	} = useLocation();

	// "Edit" from the menu's more menu still opens it in the editor.
	if ( ! isNavigationMenuEditingEnabled() || query?.canvas === 'edit' ) {
		return <Editor />;
	}

	return <NavigationMenuLocations navigationId={ Number( postId ) } />;
}

/**
 * The canvas on the Navigation section. With a single menu, the sidebar opens
 * it straight away, so its locations show here too.
 */
export function NavigationCanvas() {
	const { query } = useLocation();
	const { records: menus, hasResolved } = useEntityRecords< {
		id: number;
	} >( 'postType', NAVIGATION_POST_TYPE, PRELOADED_NAVIGATION_MENUS_QUERY );

	if (
		! isNavigationMenuEditingEnabled() ||
		query?.canvas === 'edit' ||
		! hasResolved ||
		menus?.length !== 1
	) {
		return <Editor />;
	}

	return <NavigationMenuLocations navigationId={ menus![ 0 ].id } />;
}
