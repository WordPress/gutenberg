/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
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

	const itemsFiltered = useMemo( () => {
		if ( items === null || searchQuery.length === 0 ) {
			return [];
		}

		return items.filter( ( item ) => {
			const { title } = getTemplateInfo( item );
			return normalizedSearch( title, searchQuery );
		} );
	}, [ items, searchQuery ] );

	const itemsRendered = useMemo( () => itemsFiltered.map( renderItem ), [
		itemsFiltered,
		renderItem,
	] );

	return (
		<NavigationGroup title={ __( 'Search results' ) }>
			{ loading && <NavigationItem title={ __( 'Loading…' ) } /> }

			{ ! loading && itemsRendered.length === 0 && (
				<NavigationItem title={ __( 'No results found.' ) } />
			) }

			{ ! loading && itemsRendered }
		</NavigationGroup>
	);
}
