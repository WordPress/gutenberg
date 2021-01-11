/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

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

	const categories = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'taxonomy', 'category', {
				search: searchQuery,
			} ),
		[ searchQuery ]
	);

	const isLoading = ! search && categories === null;
	const shouldShowLoadingForDebouncing = search && isDebouncing;
	const showLoading = isLoading || shouldShowLoadingForDebouncing;

	return (
		<NavigationMenu
			menu={ MENU_CONTENT_CATEGORIES }
			title={ __( 'Categories' ) }
			parentMenu={ MENU_ROOT }
			hasSearch={ true }
			onSearch={ onSearch }
			search={ search }
		>
			{ search && ! isDebouncing && (
				<SearchResults items={ categories } search={ search } />
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
