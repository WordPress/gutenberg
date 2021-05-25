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
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { MENU_CONTENT_POSTS, MENU_ROOT } from '../constants';
import ContentNavigationItem from '../content-navigation-item';
import SearchResults from '../search-results';
import useDebouncedSearch from '../use-debounced-search';
import { store as editSiteStore } from '../../../../store';

export default function ContentPostsMenu() {
	const {
		search,
		searchQuery,
		onSearch,
		isDebouncing,
	} = useDebouncedSearch();

	const { posts, showOnFront, isResolved } = useSelect(
		( select ) => {
			const {
				getEntityRecords,
				getEditedEntityRecord,
				hasFinishedResolution,
			} = select( coreStore );
			const getEntityRecodsArgs = [
				'postType',
				'post',
				{
					search: searchQuery,
				},
			];
			const hasResolvedPosts = hasFinishedResolution(
				'getEntityRecords',
				getEntityRecodsArgs
			);
			return {
				posts: getEntityRecords( ...getEntityRecodsArgs ),
				isResolved: hasResolvedPosts,
				showOnFront: getEditedEntityRecord( 'root', 'site' )
					.show_on_front,
			};
		},
		[ searchQuery ]
	);

	const { setPage } = useDispatch( editSiteStore );

	const onActivateFrontItem = useCallback( () => {
		setPage( {
			type: 'page',
			path: '/',
			context: {
				queryContext: { page: 1 },
			},
		} );
	}, [ setPage ] );

	const shouldShowLoadingForDebouncing = search && isDebouncing;
	const showLoading = ! isResolved || shouldShowLoadingForDebouncing;

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
				<SearchResults
					items={ posts }
					search={ search }
					disableFilter
				/>
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
