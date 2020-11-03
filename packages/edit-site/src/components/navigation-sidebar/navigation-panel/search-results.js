/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationGroup as NavigationGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function SearchResults( { items, children } ) {
	return (
		<NavigationGroup title={ __( 'Search results' ) }>
			{ items === null && <NavigationItem title={ __( 'Loading…' ) } /> }

			{ items?.length === 0 && (
				<NavigationItem title={ __( 'No results found.' ) } />
			) }

			{ children }
		</NavigationGroup>
	);
}
