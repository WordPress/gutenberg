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
import { MENU_CONTENT_PAGES, MENU_ROOT } from '../constants';
import ContentNavigationItem from '../content-navigation-item';
import SearchResults from '../search-results';

export default function ContentPagesMenu() {
	const [ search, setSearch ] = useState( '' );
	const onSearch = useCallback( ( value ) => {
		setSearch( value );
	} );

	const pages = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'page', {
				per_page: -1,
			} ),
		[]
	);

	return (
		<NavigationMenu
			menu={ MENU_CONTENT_PAGES }
			title={ __( 'Pages' ) }
			parentMenu={ MENU_ROOT }
			hasSearch={ true }
			onSearch={ onSearch }
			search={ search }
		>
			{ search && <SearchResults items={ pages } search={ search } /> }

			{ ! search &&
				pages?.map( ( page ) => (
					<ContentNavigationItem
						item={ page }
						key={ `${ page.type }-${ page.id }` }
					/>
				) ) }

			{ ! search && pages === null && (
				<NavigationItem title={ __( 'Loading…' ) } isText />
			) }
		</NavigationMenu>
	);
}
