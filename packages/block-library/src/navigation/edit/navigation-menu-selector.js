/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem, MenuItemsChoice } from '@wordpress/components';
import { useEntityId, useEntityRecords } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';

export default function NavigationMenuSelector( {
	onSelect,
	onCreateNew,
	showCreate = false,
} ) {
	const navigationMenus = useEntityRecords( 'postType', 'wp_navigation', {
		per_page: -1,
		status: 'publish',
	} );
	const ref = useEntityId( 'postType', 'wp_navigation' );

	return (
		<>
			<MenuGroup>
				<MenuItemsChoice
					value={ ref }
					onSelect={ ( selectedId ) =>
						onSelect(
							navigationMenus.records.find(
								( post ) => post.id === selectedId
							)
						)
					}
					choices={ navigationMenus.records.map(
						( { id, title } ) => {
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
						}
					) }
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
