/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationMenu as NavigationMenu,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { MENU_CONTENT_CATEGORIES, MENU_ROOT } from '../constants';
import ContentNavigationItem from '../content-navigation-item';
import SearchResults from '../search-results';

export default function ContentCategoriesMenu() {
	const [ search, setSearch ] = useState( '' );
	const onSearch = useCallback( ( value ) => {
		setSearch( value );
	} );

	const categories = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'taxonomy', 'category', {
				per_page: -1,
			} ),
		[]
	);

	return (
		<NavigationMenu
			menu={ MENU_CONTENT_CATEGORIES }
			title={ __( 'Categories' ) }
			parentMenu={ MENU_ROOT }
			hasSearch={ true }
			onSearch={ onSearch }
			search={ search }
		>
			{ search && (
				<SearchResults items={ categories } search={ search } />
			) }

			{ ! search &&
				categories?.map( ( category ) => (
					<ContentNavigationItem
						item={ category }
						key={ `${ category.taxonomy }-${ category.id }` }
					/>
				) ) }

			{ ! search && categories === null && (
				<NavigationItem title={ __( 'Loading…' ) } isText />
			) }
		</NavigationMenu>
	);
}
