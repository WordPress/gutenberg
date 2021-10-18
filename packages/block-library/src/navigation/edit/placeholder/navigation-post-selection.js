/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItemsChoice } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useNavigationPost from '../../use-navigation-post';

export default function NavigationPostSelection( { onSelect } ) {
	const { navigationPost, navigationPosts } = useNavigationPost();

	return (
		<MenuGroup>
			<MenuItemsChoice
				value={ navigationPost?.id }
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
