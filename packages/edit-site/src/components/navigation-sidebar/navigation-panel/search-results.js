/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __experimentalNavigationGroup as NavigationGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getTemplateInfo } from '../../../utils';
import { normalizedSearch } from './utils';
import NavigationItemText from './navigation-item-text';

export default function SearchResults( {
	items,
	searchQuery,
	renderItem,
	isDebouncing,
} ) {
	const loading = items === null;

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
			{ loading && <NavigationItemText title={ __( 'Loading…' ) } /> }

			{ ! loading && ! isDebouncing && itemsRendered.length === 0 && (
				<NavigationItemText title={ __( 'No results found.' ) } />
			) }

			{ ! loading && itemsRendered }
		</NavigationGroup>
	);
}
