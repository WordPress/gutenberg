/**
 * WordPress dependencies
 */
import {
	__experimentalNavigationItem as NavigationItem,
	__experimentalNavigationGroup as NavigationGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function SearchResults( {
	items,
	isDebouncing,
	search,
	children,
} ) {
	const loading = items === null || isDebouncing;

	if ( search.length === 1 ) {
		return (
			<NavigationGroup title={ __( 'Search results' ) }>
				<NavigationItem
					title={ __(
						'Type at least 2 characters to start searching…'
					) }
				/>
			</NavigationGroup>
		);
	}

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
