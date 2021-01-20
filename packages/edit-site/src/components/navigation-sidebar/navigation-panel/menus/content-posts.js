/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { MENU_CONTENT_POSTS, MENU_ROOT } from '../constants';
import ContentNavigationItem from '../content-navigation-item';
import SearchResults from '../search-results';
import useDebouncedSearch from '../use-debounced-search';

export default function ContentPostsMenu() {
	const {
		search,
		searchQuery,
		onSearch,
		isDebouncing,
	} = useDebouncedSearch();

	const { posts, showOnFront, isResolved } = useSelect(
		( select ) => {
			const { getEntityRecords, getEditedEntityRecord } = select(
				'core'
			);
			const hasResolvedPosts = select( 'core' ).hasFinishedResolution(
				'getEntityRecords',
				[
					'postType',
					'post',
					{
						search: searchQuery,
					},
				]
			);
			return {
				posts: getEntityRecords( 'postType', 'post', {
					search: searchQuery,
				} ),
				isResolved: hasResolvedPosts,
				showOnFront: getEditedEntityRecord( 'root', 'site' )
					.show_on_front,
			};
		},
		[ searchQuery ]
	);

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

	const isLoading = ! search && ! isResolved;
	const shouldShowLoadingForDebouncing = search && isDebouncing;
	const showLoading = isLoading || shouldShowLoadingForDebouncing;

	return (
		<NavigationMenu
			menu={ MENU_CONTENT_POSTS }
			title={ __( 'Posts' ) }
			parentMenu={ MENU_ROOT }
			hasSearch={ true }
			onSearch={ onSearch }
			search={ search }
			isSearchDebouncing={ isDebouncing || ! isResolved }
		>
			{ search && ! isDebouncing && (
				<SearchResults items={ posts } search={ search } />
			) }

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

			{ showLoading && (
				<NavigationItem title={ __( 'Loading…' ) } isText />
			) }
		</NavigationMenu>
	);
}
