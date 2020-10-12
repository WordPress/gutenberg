/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigationEntityItems from '../navigation-entity-items';

export default function ContentPostsMenu() {
	const showOnFront = useSelect(
		( select ) =>
			select( 'core' ).getEditedEntityRecord( 'root', 'site' )
				.show_on_front,
		[]
	);

	const { setPage } = useDispatch( 'core/edit-site' );

	const onActivateFrontItem = () => {
		setPage( {
			type: 'page',
			path: '/',
			context: {
				query: { categoryIds: [] },
				queryContext: { page: 1 },
			},
		} );
	};

	return (
		<NavigationMenu
			menu="content-posts"
			title={ __( 'Posts' ) }
			parentMenu="root"
		>
			{ showOnFront === 'posts' && (
				<NavigationItem
					item={ 'content-/' }
					title={ __( 'All Posts' ) }
					onClick={ onActivateFrontItem }
				/>
			) }
			<NavigationEntityItems kind="postType" name="post" />
		</NavigationMenu>
	);
}
