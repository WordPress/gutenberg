/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationGroup as NavigationGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getTemplateInfo } from '../../../utils';
import { normalizedSearch } from './utils';

export default function SearchResults( {
	items,
	isDebouncing,
	searchQuery,
	renderItem,
} ) {
	const loading = items === null || isDebouncing;

	const itemsFiltered = items.filter( ( item ) => {
		const { title } = getTemplateInfo( item );
		return normalizedSearch( title, searchQuery );
	} );

	return (
		<NavigationGroup title={ __( 'Search results' ) }>
			{ loading && <NavigationItem title={ __( 'Loading…' ) } /> }

			{ ! loading && items?.length === 0 && (
				<NavigationItem title={ __( 'No results found.' ) } />
			) }

			{ ! loading && itemsFiltered.map( renderItem ) }
		</NavigationGroup>
	);
}
