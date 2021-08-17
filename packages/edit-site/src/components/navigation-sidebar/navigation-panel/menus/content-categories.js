/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { MENU_CONTENT_CATEGORIES, MENU_ROOT } from '../constants';
import ContentNavigationItem from '../content-navigation-item';
import SearchResults from '../search-results';
import useDebouncedSearch from '../use-debounced-search';

export default function ContentCategoriesMenu() {
	const {
		search,
		searchQuery,
		onSearch,
		isDebouncing,
	} = useDebouncedSearch();

	const { categories, isResolved } = useSelect(
		( select ) => {
			const { getEntityRecords, hasFinishedResolution } = select(
				coreStore
			);
			const getEntityRecordsArgs = [
				'taxonomy',
				'category',
				{
					search: searchQuery,
				},
			];
			const hasResolvedPosts = hasFinishedResolution(
				'getEntityRecords',
				getEntityRecordsArgs
			);
			return {
				categories: getEntityRecords( ...getEntityRecordsArgs ),
				isResolved: hasResolvedPosts,
			};
		},
		[ searchQuery ]
	);

	const shouldShowLoadingForDebouncing = search && isDebouncing;
	const showLoading = ! isResolved || shouldShowLoadingForDebouncing;

	return (
		<NavigationMenu
			menu={ MENU_CONTENT_CATEGORIES }
			title={ __( 'Categories' ) }
			parentMenu={ MENU_ROOT }
			hasSearch={ true }
			onSearch={ onSearch }
			search={ search }
			isSearchDebouncing={ isDebouncing || ! isResolved }
		>
			{ search && ! isDebouncing && (
				<SearchResults
					items={ categories }
					search={ search }
					disableFilter
				/>
			) }

			{ ! search &&
				categories?.map( ( category ) => (
					<ContentNavigationItem
						item={ category }
						key={ `${ category.taxonomy }-${ category.id }` }
					/>
				) ) }

			{ showLoading && (
				<NavigationItem title={ __( 'Loading…' ) } isText />
			) }
		</NavigationMenu>
	);
}
