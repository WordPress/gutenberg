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

export default function NavigationMenuSelector( {
	onSelect,
	onCreateNew,
	showCreate = false,
} ) {
	const { navigationMenus } = useNavigationMenu();
	const ref = useEntityId( 'postType', 'wp_navigation' );

	return (
		<>
			<MenuGroup>
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
			{ showCreate && (
				<MenuGroup>
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
			) }
		</>
	);
}
