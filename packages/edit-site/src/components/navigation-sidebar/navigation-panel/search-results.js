/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationGroup as NavigationGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function SearchResults( { items, debouncing, children } ) {
	const loading = items === null || debouncing;

	return (
		<NavigationGroup title={ __( 'Search results' ) }>
			{ loading && <NavigationItem title={ __( 'Loading…' ) } /> }

			{ ! loading && items?.length === 0 && (
				<NavigationItem title={ __( 'No results found.' ) } />
			) }

			{ ! loading && children }
		</NavigationGroup>
	);
}
