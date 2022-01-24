/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem, MenuItemsChoice } from '@wordpress/components';
import { useEntityId } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';
import useNavigationEntities from '../use-navigation-entities';
import useConvertClassicMenu from '../use-convert-classic-menu';
import useCreateNavigationMenu from './use-create-navigation-menu';

export default function NavigationMenuSelector( {
	clientId,
	onSelect,
	onCreateNew,
	canUserCreateNavigation = false,
} ) {
	const { menus: classicMenus } = useNavigationEntities();
	const { navigationMenus } = useNavigationMenu();
	const ref = useEntityId( 'postType', 'wp_navigation' );

	const createNavigationMenu = useCreateNavigationMenu( clientId );

	const onFinishMenuCreation = async (
		blocks,
		navigationMenuTitle = null
	) => {
		if ( ! canUserCreateNavigation ) {
			return;
		}

		const navigationMenu = await createNavigationMenu(
			navigationMenuTitle,
			blocks
		);
		onSelect( navigationMenu );
	};

	const convertClassicMenuToBlocks = useConvertClassicMenu(
		onFinishMenuCreation
	);

	return (
		<>
			<MenuGroup label={ __( 'Menus' ) }>
				<MenuItemsChoice
					value={ ref }
					onSelect={ ( selectedId ) =>
						onSelect(
							navigationMenus.find(
								( post ) => post.id === selectedId
							)
						)
					}
					choices={ navigationMenus.map( ( { id, title } ) => {
						const label = decodeEntities( title.rendered );
						return {
							value: id,
							label,
							'aria-label': sprintf(
								/* translators: %s: The name of a menu. */
								__( "Switch to '%s'" ),
								label
							),
						};
					} ) }
				/>
			</MenuGroup>
			{ canUserCreateNavigation && (
				<>
					<MenuGroup label={ __( 'Classic Menus' ) }>
						{ classicMenus.map( ( menu ) => {
							return (
								<MenuItem
									onClick={ () => {
										convertClassicMenuToBlocks(
											menu.id,
											menu.name
										);
									} }
									key={ menu.id }
								>
									{ decodeEntities( menu.name ) }
								</MenuItem>
							);
						} ) }
					</MenuGroup>
					<MenuGroup label={ __( 'Tools' ) }>
						<MenuItem onClick={ onCreateNew }>
							{ __( 'Create new menu' ) }
						</MenuItem>
						<MenuItem
							href={ addQueryArgs( 'edit.php', {
								post_type: 'wp_navigation',
							} ) }
						>
							{ __( 'Manage menus' ) }
						</MenuItem>
					</MenuGroup>
				</>
			) }
		</>
	);
}
