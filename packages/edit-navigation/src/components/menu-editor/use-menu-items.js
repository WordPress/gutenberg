/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

export default function useMenuItems( query ) {
	return useSelect( ( select ) => ( {
		menuItems: select( 'core' ).getMenuItems( query ),
		isResolving: select( 'core/data' ).isResolving(
			'core',
			'getMenuItems',
			[ query ]
		),
	} ) );
}
