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

export default function SearchResults( { items, search, renderItem } ) {
	const itemsFiltered = useMemo( () => {
		if ( items === null || search.length === 0 ) {
			return [];
		}

		return items.filter( ( item ) => {
			const { title } = getTemplateInfo( item );
			return normalizedSearch( title, search );
		} );
	}, [ items, search ] );

	const itemsRendered = useMemo( () => itemsFiltered.map( renderItem ), [
		itemsFiltered,
		renderItem,
	] );

	return (
		<NavigationGroup title={ __( 'Search results' ) }>
			{ itemsRendered }
		</NavigationGroup>
	);
}
