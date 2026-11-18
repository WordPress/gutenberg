import { __ } from '@wordpress/i18n';
import { parse } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { SidebarNavigationScreenWrapper } from '../sidebar-navigation-screen-navigation-menus';
import ScreenNavigationMoreMenu from './more-menu';
import NavigationMenuEditor from './navigation-menu-editor';
import buildNavigationLabel from '../sidebar-navigation-screen-navigation-menus/build-navigation-label';

/**
 * The description for a menu's screen. With menu editing on, it says how the
 * menu gets its items: an Auto menu adds new pages itself, a customized one
 * doesn't. Otherwise, the general description of menus, as before.
 *
 * @param {?number} navigationId The menu.
 * @return {?string} The description, or null for none (while loading).
 */
export function useMenuDescription( navigationId ) {
	const isAutoMenu = useSelect(
		( select ) => {
			if ( ! navigationId ) {
				return null;
			}
			const record = select( coreStore ).getEditedEntityRecord(
				'postType',
				'wp_navigation',
				navigationId
			);
			if ( ! record ) {
				return null;
			}
			let blocks = record.blocks;
			if ( ! Array.isArray( blocks ) ) {
				const content =
					typeof record.content === 'string'
						? record.content
						: record.content?.raw;
				blocks = parse( content || '' );
			}
			return blocks.length === 1 && blocks[ 0 ].name === 'core/page-list';
		},
		[ navigationId ]
	);

	if ( ! globalThis.__experimentalNavigationMenuEditing ) {
		return __(
			'Navigation Menus are a curated collection of blocks that allow visitors to get around your site.'
		);
	}
	if ( isAutoMenu === null ) {
		return null;
	}
	return isAutoMenu
		? __(
				'Your menu shows your published pages, and updates itself when you add a page.'
			)
		: __(
				'This menu is customized, so new pages aren’t added to it automatically.'
			);
}

export default function SingleNavigationMenu( {
	navigationMenu,
	backPath,
	handleDelete,
	handleDuplicate,
	handleSave,
} ) {
	const menuTitle = navigationMenu?.title?.rendered;

	return (
		<SidebarNavigationScreenWrapper
			actions={
				<>
					<ScreenNavigationMoreMenu
						menuId={ navigationMenu?.id }
						menuTitle={ decodeEntities( menuTitle ) }
						onDelete={ handleDelete }
						onSave={ handleSave }
						onDuplicate={ handleDuplicate }
					/>
				</>
			}
			backPath={ backPath }
			title={ buildNavigationLabel(
				navigationMenu?.title,
				navigationMenu?.id,
				navigationMenu?.status
			) }
			description={ useMenuDescription( navigationMenu?.id ) }
		>
			<NavigationMenuEditor navigationMenuId={ navigationMenu?.id } />
		</SidebarNavigationScreenWrapper>
	);
}
