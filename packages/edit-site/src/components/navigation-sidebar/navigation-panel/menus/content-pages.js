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
import { MENU_CONTENT_PAGES, MENU_ROOT } from '../constants';
import ContentNavigationItem from '../content-navigation-item';
import SearchResults from '../search-results';
import useDebouncedSearch from '../use-debounced-search';

export default function ContentPagesMenu() {
	const {
		search,
		searchQuery,
		onSearch,
		isDebouncing,
	} = useDebouncedSearch();

	const { pages, isResolved } = useSelect(
		( select ) => {
			const { getEntityRecords, hasFinishedResolution } = select(
				coreStore
			);
			const getEntityRecordsArgs = [
				'postType',
				'page',
				{
					search: searchQuery,
				},
			];
			const hasResolvedPosts = hasFinishedResolution(
				'getEntityRecords',
				getEntityRecordsArgs
			);
			return {
				pages: getEntityRecords( ...getEntityRecordsArgs ),
				isResolved: hasResolvedPosts,
			};
		},
		[ searchQuery ]
	);

	const shouldShowLoadingForDebouncing = search && isDebouncing;
	const showLoading = ! isResolved || shouldShowLoadingForDebouncing;

	return (
		<NavigationMenu
			menu={ MENU_CONTENT_PAGES }
			title={ __( 'Pages' ) }
			parentMenu={ MENU_ROOT }
			hasSearch={ true }
			onSearch={ onSearch }
			search={ search }
			isSearchDebouncing={ isDebouncing || ! isResolved }
		>
			{ search && ! isDebouncing && (
				<SearchResults
					items={ pages }
					search={ search }
					disableFilter
				/>
			) }

			{ ! search &&
				pages?.map( ( page ) => (
					<ContentNavigationItem
						item={ page }
						key={ `${ page.type }-${ page.id }` }
					/>
				) ) }

			{ showLoading && (
				<NavigationItem title={ __( 'Loading…' ) } isText />
			) }
		</NavigationMenu>
	);
}
