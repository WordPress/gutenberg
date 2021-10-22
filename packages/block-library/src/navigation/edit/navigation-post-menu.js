/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItemsChoice } from '@wordpress/components';
import { useEntityId } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useNavigationPost from '../use-navigation-post';

export default function NavigationPostMenu( { onSelect } ) {
	const { navigationPosts } = useNavigationPost();
	const navigationPostId = useEntityId( 'postType', 'wp_navigation' );

	return (
		<MenuGroup>
			<MenuItemsChoice
				value={ navigationPostId }
				onSelect={ ( selectedId ) =>
					onSelect(
						navigationPosts.find(
							( post ) => post.id === selectedId
						)
					)
				}
				choices={ navigationPosts.map( ( { id, title } ) => ( {
					value: id,
					label: title.rendered,
				} ) ) }
			/>
		</MenuGroup>
	);
}
