/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useNavigationContext } from '../context';
import { ItemBaseUI, ItemUI } from '../styles/navigation-styles';

export default function NavigationSearchNoResultsFound( { search } ) {
	const {
		navigationTree: { items },
	} = useNavigationContext();

	const resultsCount = filter( items, '_isVisible' ).length;

	if ( ! search || !! resultsCount ) {
		return null;
	}

	return (
		<ItemBaseUI>
			<ItemUI>{ __( 'No results found.' ) } </ItemUI>
		</ItemBaseUI>
	);
}
