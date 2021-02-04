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
import { MENU_CONTENT_POSTS, MENU_ROOT } from '../constants';
import { store as editSiteStore } from '../../../../store';

export default function ContentPostsMenu() {
	const showOnFront = useSelect(
		( select ) =>
			select( 'core' ).getEditedEntityRecord( 'root', 'site' )
				.show_on_front,
		[]
	);

	const { setPage } = useDispatch( editSiteStore );

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
			menu={ MENU_CONTENT_POSTS }
			title={ __( 'Posts' ) }
			parentMenu={ MENU_ROOT }
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
