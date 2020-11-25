/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { MENU_CONTENT_POSTS, MENU_ROOT } from '../constants';
import ContentNavigationItem from '../content-navigation-item';
import SearchResults from '../search-results';

export default function ContentPostsMenu() {
	const [ search, setSearch ] = useState( '' );
	const onSearch = useCallback( ( value ) => {
		setSearch( value );
	} );

	const { posts, showOnFront } = useSelect( ( select ) => {
		const { getEntityRecords, getEditedEntityRecord } = select( 'core' );
		return {
			posts: getEntityRecords( 'postType', 'post', {
				per_page: -1,
			} ),
			showOnFront: getEditedEntityRecord( 'root', 'site' ).show_on_front,
		};
	}, [] );

	const { setPage } = useDispatch( 'core/edit-site' );

	const onActivateFrontItem = useCallback( () => {
		setPage( {
			type: 'page',
			path: '/',
			context: {
				query: { categoryIds: [] },
				queryContext: { page: 1 },
			},
		} );
	}, [ setPage ] );

	return (
		<NavigationMenu
			menu={ MENU_CONTENT_POSTS }
			title={ __( 'Posts' ) }
			parentMenu={ MENU_ROOT }
			hasSearch={ true }
			onSearch={ onSearch }
			search={ search }
		>
			{ search && <SearchResults items={ posts } search={ search } /> }

			{ ! search && (
				<>
					{ showOnFront === 'posts' && (
						<NavigationItem
							item={ 'post-/' }
							title={ __( 'All Posts' ) }
							onClick={ onActivateFrontItem }
						/>
					) }

					{ posts?.map( ( post ) => (
						<ContentNavigationItem
							item={ post }
							key={ `${ post.type }-${ post.id }` }
						/>
					) ) }
				</>
			) }

			{ ! search && posts === null && (
				<NavigationItem title={ __( 'Loading…' ) } isText />
			) }
		</NavigationMenu>
	);
}
